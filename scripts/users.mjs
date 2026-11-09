#!/usr/bin/env node
// data/users.json 사용자 관리 스크립트. 바꾼 뒤에는 커밋·푸시해야 배포 환경에 반영된다.
//
//   npm run user -- list
//   npm run user -- add <이메일> <이름> [--admin] [--id <아이디>]
//   npm run user -- passwd <이메일|아이디>
//   npm run user -- disable <이메일|아이디>
//   npm run user -- enable <이메일|아이디>
//   npm run user -- remove <이메일|아이디>
//
// 비밀번호는 화면에 보이지 않게 입력받고, scrypt 해시만 파일에 저장한다.
// (해시 형식은 src/lib/users.ts와 같아야 한다.)

import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "users.json");
const KEY_LEN = 64;

const load = () => JSON.parse(readFileSync(FILE, "utf8"));
const save = (users) => writeFileSync(FILE, JSON.stringify(users, null, 2) + "\n");

function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("base64url")}$${scryptSync(password, salt, KEY_LEN).toString("base64url")}`;
}

function checkRule(pw) {
  if (pw.length < 8 || pw.length > 72) return "비밀번호는 8~72자여야 합니다.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "비밀번호에는 영문과 숫자가 모두 들어가야 합니다.";
  return null;
}

// 터미널에서는 입력을 가리고, 파이프 입력(자동화)에서는 한 줄씩 읽는다.
let pipedLines;
async function readSecret(prompt) {
  if (!process.stdin.isTTY) {
    if (!pipedLines) {
      let data = "";
      for await (const chunk of process.stdin) data += chunk;
      pipedLines = data.split(/\r?\n/);
    }
    return pipedLines.shift() ?? "";
  }
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve) => {
    let value = "";
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      } else if (ch === "\u007f" || ch === "\b") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function askNewPassword() {
  const pw = await readSecret("새 비밀번호: ");
  const err = checkRule(pw);
  if (err) fail(err);
  if ((await readSecret("새 비밀번호 확인: ")) !== pw) fail("비밀번호 확인이 일치하지 않습니다.");
  return hashPassword(pw);
}

function fail(msg) {
  console.error(`오류: ${msg}`);
  process.exit(1);
}

function find(users, key) {
  const k = String(key ?? "").toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === k || u.id.toLowerCase() === k);
  if (!user) fail(`사용자를 찾을 수 없습니다: ${key}`);
  return user;
}

const [cmd, ...args] = process.argv.slice(2);
const users = load();

switch (cmd) {
  case "list": {
    if (!users.length) console.log("등록된 사용자가 없습니다.");
    for (const u of users) {
      console.log(`${u.disabled ? "✗" : "✓"} ${u.id.padEnd(16)} ${u.email.padEnd(32)} ${u.name} (${u.role})`);
    }
    break;
  }
  case "add": {
    const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--id");
    const [email, ...nameParts] = positional;
    const name = nameParts.join(" ");
    if (!email || !email.includes("@") || !name) fail("사용법: add <이메일> <이름> [--admin] [--id <아이디>]");
    const idIdx = args.indexOf("--id");
    const id = (idIdx >= 0 ? args[idIdx + 1] : email.split("@")[0])?.trim();
    if (!id) fail("--id 값이 비어 있습니다.");
    const taken = users.some((u) =>
      [u.email.toLowerCase(), u.id.toLowerCase()].some((k) => k === email.toLowerCase() || k === id.toLowerCase()),
    );
    if (taken) fail(`이미 같은 이메일 또는 아이디가 있습니다: ${email} / ${id}`);
    const passwordHash = await askNewPassword();
    users.push({ id, email, name, role: args.includes("--admin") ? "admin" : "user", passwordHash });
    save(users);
    console.log(`추가했습니다: ${id} (${email})`);
    break;
  }
  case "passwd": {
    const user = find(users, args[0]);
    user.passwordHash = await askNewPassword();
    save(users);
    console.log(`비밀번호를 바꿨습니다: ${user.id}`);
    break;
  }
  case "disable":
  case "enable": {
    const user = find(users, args[0]);
    if (cmd === "disable") user.disabled = true;
    else delete user.disabled;
    save(users);
    console.log(`${cmd === "disable" ? "비활성화" : "활성화"}했습니다: ${user.id}`);
    break;
  }
  case "remove": {
    const user = find(users, args[0]);
    save(users.filter((u) => u !== user));
    console.log(`삭제했습니다: ${user.id}`);
    break;
  }
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 12).join("\n").replace(/^\/\/ ?/gm, ""));
    process.exit(cmd ? 1 : 0);
}
