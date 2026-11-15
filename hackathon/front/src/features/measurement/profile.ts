import { type MeasurementResultData } from "../../api/measurements";
import { applyFootProfile } from "../../api/profiles";
import { AUTH_ACCESS_TOKEN_KEY, FOOT_PROFILE_STORAGE_KEY } from "../shared/storage";

export type FootProfile = {
  measuredAt: string;
  recommendedSizeMm: number;
  footLengthMm: number;
  footWidthMm: number;
  footWidthLabel: string;
  footSide?: "LEFT" | "RIGHT";
  footSideLabel: string;
  instepLabel: string;
  fitScore: number;
};

export function getTodayLabel() {
  return new Date()
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s?/g, ".")
    .replace(/\.$/, "");
}

export function createMeasuredFootProfile(): FootProfile {
  return {
    measuredAt: getTodayLabel(),
    recommendedSizeMm: 275,
    footLengthMm: 263.5,
    footWidthMm: 102,
    footWidthLabel: "보통 D",
    footSide: "RIGHT",
    footSideLabel: "오른발",
    instepLabel: "보통",
    fitScore: 96,
  };
}

export function createFootProfileFromMeasurement(result: MeasurementResultData): FootProfile {
  // 신발 추천 사이즈: 발 실측 길이 기준 5mm 단위 반올림 (예: 269.8mm -> 270mm, 273.8mm -> 275mm)
  const recommendedSizeMm = Math.round(result.foot_length_mm / 5) * 5;
  const footSide = result.foot_side === "LEFT" ? "LEFT" : "RIGHT";
  const footSideLabel = footSide === "LEFT" ? "왼발" : "오른발";
  const footWidthLabel =
    result.foot_width_mm >= 105
      ? "넓은 편 E"
      : result.foot_width_mm >= 95
        ? "보통 D"
        : "좁은 편 C";
  const fitScore = result.segmentation_confidence
    ? Math.round(result.segmentation_confidence * 100)
    : 92;

  return {
    measuredAt: formatDateLabel(result.measured_at),
    recommendedSizeMm,
    footLengthMm: Number(result.foot_length_mm.toFixed(1)),
    footWidthMm: Number(result.foot_width_mm.toFixed(1)),
    footWidthLabel,
    footSide,
    footSideLabel,
    instepLabel: "보통",
    fitScore,
  };
}

export function formatDateLabel(value: string) {
  return new Date(value)
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s?/g, ".")
    .replace(/\.$/, "");
}

export function loadFootProfile() {
  const rawProfile = localStorage.getItem(FOOT_PROFILE_STORAGE_KEY);

  if (!rawProfile) {
    return null;
  }

  try {
    return JSON.parse(rawProfile) as FootProfile;
  } catch {
    return null;
  }
}

export function saveFootProfile(profile: FootProfile) {
  localStorage.setItem(FOOT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function hasFootProfile() {
  return loadFootProfile() !== null;
}

export function getFootWidthMm(profile: FootProfile) {
  if (typeof profile.footWidthMm === "number") {
    return profile.footWidthMm;
  }

  if (profile.footWidthLabel.includes("넓은")) {
    return 108;
  }

  if (profile.footWidthLabel.includes("좁은")) {
    return 90;
  }

  return 98;
}

export async function saveFootProfileToDatabase(profile: FootProfile) {
  const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

  if (!accessToken) {
    return;
  }

  await applyFootProfile(accessToken, {
    foot_length_mm: profile.footLengthMm,
    foot_width_mm: getFootWidthMm(profile),
    foot_side: profile.footSide || "RIGHT",
    confidence: profile.fitScore / 100,
    measured_at: new Date().toISOString(),
  });
}

export function deleteFootProfile() {
  localStorage.removeItem(FOOT_PROFILE_STORAGE_KEY);
}

export function getSizeChoices(recommendedSizeMm: number) {
  return [
    { size: recommendedSizeMm - 5, label: "약간 타이트" },
    { size: recommendedSizeMm, label: "추천" },
    { size: recommendedSizeMm + 5, label: "약간 여유" },
  ];
}

export function getFootProfileSummary(profile: FootProfile) {
  return [
    { label: "발 길이", value: `${profile.footLengthMm}`, unit: "mm" },
    { label: "발볼", value: profile.footWidthLabel.replace(" D", "") },
    { label: "발등", value: profile.instepLabel },
  ];
}

export function getFootProfileAnalysis(profile: FootProfile) {
  const footWidthMm = getFootWidthMm(profile);
  const messages: string[] = [];

  if (footWidthMm >= 105) {
    messages.push(
      "발볼이 넓은 편이라 앞코가 좁은 신발은 압박이 있을 수 있어요.",
    );
  } else if (footWidthMm >= 95) {
    messages.push("발볼은 보통 범위라 대부분의 일반 핏 신발과 잘 맞아요.");
  } else {
    messages.push(
      "발볼이 좁은 편이라 정사이즈 착용 시 여유가 느껴질 수 있어요.",
    );
  }

  if (profile.instepLabel.includes("높")) {
    messages.push("발등이 높은 편이라 끈 조절이 가능한 신발을 추천해요.");
  } else if (profile.instepLabel.includes("낮")) {
    messages.push("발등이 낮은 편이라 발을 안정적으로 잡아주는 핏이 좋아요.");
  } else {
    messages.push("발등은 보통 범위라 기본 핏에서도 안정적인 착화가 가능해요.");
  }

  if (profile.fitScore >= 95) {
    messages.push("측정 신뢰도가 높아 추천 사이즈를 그대로 사용해도 좋아요.");
  } else if (profile.fitScore < 85) {
    messages.push("측정 신뢰도가 낮아 실제 착용 전 한 번 더 확인하는 것을 추천해요.");
  }

  messages.push(
    `${profile.recommendedSizeMm}mm 기준의 안정적인 착화감을 추천해요.`,
  );

  return messages.join(" ");
}

export function getBrandSizeRows(profile: FootProfile) {
  return [
    { brand: "NIKE", size: profile.recommendedSizeMm - 5 },
    { brand: "Adidas", size: profile.recommendedSizeMm },
    { brand: "New Balance", size: profile.recommendedSizeMm },
    { brand: "Asics", size: profile.recommendedSizeMm },
    { brand: "Mizuno", size: profile.recommendedSizeMm - 5 },
  ];
}
