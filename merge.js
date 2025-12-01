const inputCodesEl = document.getElementById("inputCodes");
const outputCodeEl = document.getElementById("outputCode");
const statusEl = document.getElementById("status");
const btnMerge = document.getElementById("btnMerge");

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function parseCode(raw) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("코드가 비어 있습니다.");

  const parts = trimmed.split("|");
  if (parts.length !== 2) {
    throw new Error("코드 형식이 올바르지 않습니다.");
  }

  const version = parseInt(parts[0], 10);
  const body = parts[1];

  if (Number.isNaN(version)) {
    throw new Error("버전 정보가 올바르지 않습니다.");
  }

  if (version === 4) {
    const [ownerCountHex, ownerPart, tokenPart] = body.split(":");
    if (!ownerCountHex || tokenPart === undefined) {
      throw new Error("코드 형식이 올바르지 않습니다.");
    }

    const ownerCount = parseInt(ownerCountHex, 16);
    const ownerHashes = ownerPart
      ? ownerPart.split(";").filter((s) => s.length > 0)
      : [];

    if (Number.isNaN(ownerCount) || ownerHashes.length !== ownerCount) {
      throw new Error("코드의 오너 영역이 올바르지 않습니다.");
    }

    const hashes = [];
    for (let i = 0; i + 8 <= tokenPart.length; i += 8) {
      hashes.push(tokenPart.slice(i, i + 8));
    }
    if (hashes.length === 0) {
      throw new Error("코드에 팔로워 해시가 없습니다.");
    }

    return { version, ownerHashes, hashes };
  }

  throw new Error("지원하지 않는 코드 버전입니다.");
}

function mergeCodes(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("최소 한 개 이상의 코드를 입력해 주세요.");
  }

  const allOwnerHashes = new Set();
  const allHashes = new Set();

  for (const line of lines) {
    const code = parseCode(line);

    if (code.version === 3) {
      if (code.ownerHash) {
        allOwnerHashes.add(code.ownerHash);
      }
      for (const h of code.hashes) {
        allHashes.add(h);
      }
    } else if (code.version === 4) {
      if (Array.isArray(code.ownerHashes)) {
        for (const oh of code.ownerHashes) {
          allOwnerHashes.add(oh);
        }
      }
      for (const h of code.hashes) {
        allHashes.add(h);
      }
    }
  }

  const ownerHashesArr = Array.from(allOwnerHashes);
  const tokensArr = Array.from(allHashes);

  const ownerCountHex = ownerHashesArr.length.toString(16).padStart(2, "0");
  const ownerPart = ownerHashesArr.join(";");
  const tokenPart = tokensArr.join("");
  const body = ownerCountHex + ":" + ownerPart + ":" + tokenPart;
  const mergedCode = "4|" + body;

  return {
    mergedCode,
    ownerCount: ownerHashesArr.length,
    tokenCount: tokensArr.length,
    inputCount: lines.length,
  };
}

function handleMerge() {
  const raw = inputCodesEl.value;
  if (!raw.trim()) {
    setStatus("먼저 합칠 코드를 입력해 주세요.");
    return;
  }

  try {
    const { mergedCode, ownerCount, tokenCount, inputCount } = mergeCodes(raw);
    outputCodeEl.value = mergedCode;
    setStatus(
      `입력 코드 ${inputCount}개 → owner ${ownerCount}개, 토큰 ${tokenCount}개로 합쳤습니다.`
    );
  } catch (e) {
    setStatus("에러: " + e.message);
  }
}

btnMerge.addEventListener("click", handleMerge);
setStatus("");
