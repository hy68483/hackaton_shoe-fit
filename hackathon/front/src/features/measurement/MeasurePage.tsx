import { Check, ChevronLeft, LockKeyhole, Ruler, ScanLine, ShieldAlert, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyzeMeasurementBatch, createMeasurementConsent, createMeasurementSession, uploadMeasurementImage, validateMeasurementImage, type MeasurementBatchShot } from "../../api/measurements";
import measureGuideImage from "../../assets/measure/measure-guide.png";
import measureProcessingImage from "../../assets/measure/measure-processing.png";
import measureStartImage from "../../assets/measure/measure-start.png";
import { getDisplayUserName } from "../auth/utils";
import { HomeTopButton } from "../shared/layout";
import { createFootProfileFromMeasurement, createMeasuredFootProfile, getBrandSizeRows, getFootProfileAnalysis, getFootProfileSummary, getSizeChoices, loadFootProfile, saveFootProfile, saveFootProfileToDatabase } from "./profile";
import type { FootProfile } from "./profile";
import { measurementResultProducts } from "../shop/data";
import { AUTH_ACCESS_TOKEN_KEY } from "../shared/storage";
import { MeasureBackButton, MeasureBottomButton, MeasureFrame, QualityMessage } from "./components";

export type MeasureStep =
  | "profile"
  | "start"
  | "paperIntro"
  | "paperChecklist"
  | "consent"
  | "guide"
  | "camera"
  | "processing"
  | "fit"
  | "result"
  | "login"
  | "denied"
  | "qualityFail";

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 크기를 확인하지 못했습니다."));
    };
    image.src = url;
  });
}

export function MeasurePage() {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [footProfile, setFootProfile] = useState<FootProfile | null>(() =>
    loadFootProfile(),
  );
  const [step, setStep] = useState<MeasureStep>(() =>
    loadFootProfile() ? "profile" : "start",
  );
  const [paperChecks, setPaperChecks] = useState([false, false, false]);
  const [consents, setConsents] = useState([false, false, false, false]);
  const [fitPreference, setFitPreference] = useState("normal");
  const [measurementSessionId, setMeasurementSessionId] = useState("");
  const [measurementShots, setMeasurementShots] = useState<MeasurementBatchShot[]>([]);
  const [measurementError, setMeasurementError] = useState("");
  const [measurementNotice, setMeasurementNotice] = useState("");
  const [processingMessage, setProcessingMessage] = useState(
    "잠시만 기다려 주세요",
  );
  const [measurementSavedByBackend, setMeasurementSavedByBackend] =
    useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveProfileNotice, setSaveProfileNotice] = useState("");
  const isLoggedIn = Boolean(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY));
  const displayUserName = getDisplayUserName();

  useEffect(() => {
    if (step === "login" && isLoggedIn) {
      setStep("start");
    }
  }, [isLoggedIn, step]);

  const allConsentChecked = consents.every(Boolean);
  const allPaperChecked = paperChecks.every(Boolean);
  const isVariationRetake = measurementError.startsWith("촬영 간 편차");

  async function startMeasurementSession() {
    const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

    if (!accessToken) {
      setStep("login");
      return;
    }

    try {
      setMeasurementError("");
      setMeasurementNotice("");
      setProcessingMessage("측정 세션을 준비하고 있어요");
      const consent = await createMeasurementConsent(accessToken);
      const session = await createMeasurementSession(
        accessToken,
        consent.data.id,
      );
      setMeasurementSessionId(session.data.session_id);
      setMeasurementShots([]);
      setStep("guide");
    } catch (error) {
      setMeasurementError(
        error instanceof Error
          ? error.message
          : "측정 세션을 생성하지 못했습니다.",
      );
    }
  }

  async function handleMeasurementImageSelected(file: File) {
    const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

    if (!accessToken) {
      setStep("login");
      return;
    }

    if (!measurementSessionId) {
      setMeasurementError("측정 세션이 없습니다. 처음부터 다시 진행해 주세요.");
      setStep("qualityFail");
      return;
    }

    try {
      setMeasurementError("");
      setProcessingMessage("이미지를 업로드하고 있어요");
      setStep("processing");
      const dimensions = await getImageDimensions(file);

      const uploaded = await uploadMeasurementImage({
        accessToken,
        sessionId: measurementSessionId,
        image: file,
        clientWidth: dimensions.width,
        clientHeight: dimensions.height,
        deviceOrientation:
          dimensions.width > dimensions.height ? "landscape" : "portrait",
      });

      setProcessingMessage("측정용지와 발 상태를 검증하고 있어요");
      await validateMeasurementImage(accessToken, measurementSessionId);

      const shot: MeasurementBatchShot = {
        imageId: uploaded.data.image_id,
        pointX: Math.round(dimensions.width / 2),
        pointY: Math.round(dimensions.height / 2),
        footSide: "RIGHT",
      };
      const nextShots = [...measurementShots, shot];
      setMeasurementShots(nextShots);

      if (nextShots.length < 3) {
        setProcessingMessage(`${nextShots.length}장 검증 완료`);
        setStep("camera");
        return;
      }

      setProcessingMessage("3장의 측정값을 비교하고 있어요");
      const result = await analyzeMeasurementBatch({
        accessToken,
        sessionId: measurementSessionId,
        shots: nextShots,
      });

      if (result.data.retake_required || !result.data.result) {
        setMeasurementShots([]);
        const measuredValues = result.data.individual_measurements
          .map(
            (measurement, index) =>
              `${index + 1}차 ${measurement.foot_length_mm.toFixed(1)}/${measurement.foot_width_mm.toFixed(1)}mm`,
          )
          .join(", ");
        const errorPrefix =
          result.data.correction_reason === "IMPLAUSIBLE_MEASUREMENT"
            ? "측정값이 정상 발 범위를 벗어났어요. 발 전체와 측정용지 마커가 보이게 다시 촬영해 주세요."
            : "촬영 간 편차가 커요. 같은 위치와 각도로 다시 촬영해 주세요.";
        setMeasurementError(`${errorPrefix} 측정값: ${measuredValues}.`);
        setStep("qualityFail");
        return;
      }

      const measuredValues = result.data.individual_measurements
        .map(
          (measurement, index) =>
            `${index + 1}차 ${measurement.foot_length_mm.toFixed(1)}/${measurement.foot_width_mm.toFixed(1)}mm`,
        )
        .join(", ");

      if (result.data.outlier_rejected) {
        const excludedShots = result.data.excluded_measurement_indices
          .map((index) => `${index + 1}차`)
          .join(", ");
        const acceptedValues = result.data.individual_measurements
          .filter((measurement) => measurement.accepted)
          .map(
            (measurement) =>
              `${measurement.foot_length_mm.toFixed(1)}/${measurement.foot_width_mm.toFixed(1)}mm`,
          )
          .join(", ");
        setMeasurementNotice(
          `${excludedShots} 촬영값을 제외하고 서로 가까운 두 장(${acceptedValues})으로 계산했어요.`,
        );
      } else {
        setMeasurementNotice(
          `3장 측정값: ${measuredValues}. 중앙값으로 최종 결과를 계산했어요.`,
        );
      }

      const profile = createFootProfileFromMeasurement(result.data.result);
      saveFootProfile(profile);
      setFootProfile(profile);
      setMeasurementSavedByBackend(true);
      setStep("fit");
    } catch (error) {
      setMeasurementError(
        error instanceof Error
          ? error.message
          : "발 측정 분석을 완료하지 못했습니다.",
      );
      setStep("qualityFail");
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  }

  async function completeMeasurement() {
    const profile = footProfile ?? createMeasuredFootProfile();
    saveFootProfile(profile);
    setFootProfile(profile);
    if (!measurementSavedByBackend) {
      try {
        await saveFootProfileToDatabase(profile);
      } catch (error) {
        setMeasurementError(
          error instanceof Error
            ? error.message
            : "발 프로필을 DB에 저장하지 못했습니다.",
        );
      }
    }
    setStep("result");
  }

  async function handleSaveResult(profile: FootProfile) {
    if (isSavingProfile) return;

    setIsSavingProfile(true);
    setSaveProfileNotice("");
    try {
      saveFootProfile(profile);
      setFootProfile(profile);
      if (!measurementSavedByBackend) {
        await saveFootProfileToDatabase(profile);
        setMeasurementSavedByBackend(true);
      }
      setSaveProfileNotice("발 프로필을 저장했어요.");
      window.setTimeout(() => navigate("/account/foot-profile"), 500);
    } catch (error) {
      setSaveProfileNotice(
        error instanceof Error
          ? error.message
          : "발 프로필을 저장하지 못했습니다.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  if (step === "login") {
    return (
      <MeasureFrame>
        <MeasureBackButton
          onClick={() => (footProfile ? setStep("profile") : setStep("start"))}
        />
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eeeaff] text-[#6b5cff]">
            <LockKeyhole size={28} />
          </div>
          <h1 className="mt-7 text-[18px] font-black">로그인이 필요해요</h1>
          <p className="mt-3 text-[12px] font-semibold leading-5 text-[#777482]">
            발 측정 결과를 저장하고 추천 사이즈를 확인하려면 로그인이 필요해요.
          </p>
        </div>
        <MeasureBottomButton onClick={() => navigate("/login")}>
          로그인 하기
        </MeasureBottomButton>
        <button
          type="button"
          onClick={() => setStep("start")}
          className="mb-8 text-center text-[12px] font-bold text-[#6b5cff]"
        >
          나중에 할게요
        </button>
      </MeasureFrame>
    );
  }

  if (step === "denied") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("consent")} />
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffecee] text-[#ff6470]">
            <ShieldAlert size={28} />
          </div>
          <h1 className="mt-7 text-[18px] font-black">
            동의하지 않으면
            <br />
            AI 측정을 진행할 수 없어요
          </h1>
          <p className="mt-4 rounded-[8px] bg-[#f7f5ff] px-4 py-3 text-[11px] font-semibold leading-5 text-[#8a8695]">
            수집된 이미지는 발 측정에만 사용되고 안전하게 처리됩니다.
          </p>
        </div>
        <MeasureBottomButton onClick={() => setStep("consent")}>
          동의하러 가기
        </MeasureBottomButton>
        <button
          type="button"
          onClick={() => window.location.assign("/home")}
          className="mb-8 text-center text-[12px] font-bold text-[#6b5cff]"
        >
          사이즈 측정 안할래요
        </button>
      </MeasureFrame>
    );
  }

  if (step === "qualityFail") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("camera")} />
        <div className="flex flex-1 flex-col px-7 pt-24">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f0eefb] text-[#777482]">
            <ScanLine size={26} />
          </div>
          <h1 className="mt-7 text-center text-[18px] font-black">
            {isVariationRetake ? (
              <>
                측정값 차이가 커요
                <br />
                세 장을 다시 촬영해 주세요
              </>
            ) : (
              <>
                측정용지를 인식하지 못했어요
                <br />
                다시 촬영할게요
              </>
            )}
          </h1>
          <p className="mt-3 text-center text-[11px] font-semibold text-[#8a8695]">
            {measurementError || "네 개의 마커가 모두 보이도록 다시 촬영해 주세요."}
          </p>
          <div className="mt-8 space-y-3">
            {isVariationRetake ? (
              <>
                <QualityMessage success>세 장 모두 분석은 완료됐어요</QualityMessage>
                <QualityMessage>같은 자세와 거리에서 다시 촬영해 주세요</QualityMessage>
              </>
            ) : (
              <>
                <QualityMessage success>사진 밝기와 흔들림은 괜찮아요</QualityMessage>
                <QualityMessage>측정용지의 네 개 마커가 모두 보여야 해요</QualityMessage>
              </>
            )}
          </div>
        </div>
        <MeasureBottomButton onClick={() => setStep("camera")}>
          재촬영 하기
        </MeasureBottomButton>
        <button
          type="button"
          onClick={() => {
            const profile = createMeasuredFootProfile();
            saveFootProfile(profile);
            setFootProfile(profile);
            setMeasurementSavedByBackend(false);
            void saveFootProfileToDatabase(profile).catch((error) => {
              setMeasurementError(
                error instanceof Error
                  ? error.message
                  : "데모 결과를 DB에 저장하지 못했습니다.",
              );
            });
            setStep("fit");
          }}
          className="mb-8 text-center text-[12px] font-bold text-[#6b5cff]"
        >
          데모 결과로 계속하기
        </button>
      </MeasureFrame>
    );
  }

  if (step === "start") {
    return (
      <MeasureFrame>
        <MeasureBackButton
          onClick={() => (footProfile ? setStep("profile") : navigate("/home"))}
        />
        <img
          src={measureStartImage}
          alt=""
          className="mx-auto mt-4 h-[300px] w-full rounded-[8px] object-cover"
        />
        <div className="px-7 pt-8 text-center">
          <h1 className="text-[18px] font-black">발 사이즈 측정</h1>
          <p className="mt-4 text-[12px] font-semibold leading-6 text-[#6b6875]">
            정확한 사이즈 추천을 위해
            <br />
            발을 촬영해 주세요.
          </p>
          {!isLoggedIn && (
            <button
              type="button"
              className="mt-6 text-[12px] font-bold text-[#6b5cff]"
              onClick={() => setStep("login")}
            >
              로그인하고 측정하기
            </button>
          )}
        </div>
        <MeasureBottomButton onClick={() => setStep("paperIntro")}>
          내 발 측정 시작
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "paperIntro") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("start")} />
        <div className="flex flex-1 flex-col px-7 pt-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#4640DE]">
            <Ruler size={28} />
          </div>
          <h1 className="mt-7 text-[18px] font-black leading-7">
            정확한 측정을 위해
            <br />
            전용 측정용지가 필요해요
          </h1>
          <p className="mt-4 text-[12px] font-semibold leading-6 text-[#6b6875]">
            A4 용지에 측정용지를 100% 크기로 인쇄한 뒤,
            <br />
            평평한 바닥에 놓고 한쪽 발을 올려주세요.
          </p>
          <div className="mt-8 rounded-[14px] bg-white p-4 shadow-sm">
            <div className="mx-auto flex aspect-[210/297] w-[145px] flex-col justify-between rounded-[8px] border border-[#d8d4fb] bg-[#fbfaff] p-3">
              <div className="flex justify-between">
                <span className="h-5 w-5 rounded-[4px] bg-[#191821]" />
                <span className="h-5 w-5 rounded-[4px] bg-[#191821]" />
              </div>
              <div className="mx-auto h-28 w-16 rounded-full border-2 border-dashed border-[#7168ff]" />
              <div className="flex justify-between">
                <span className="h-5 w-5 rounded-[4px] bg-[#191821]" />
                <span className="h-5 w-5 rounded-[4px] bg-[#191821]" />
              </div>
            </div>
            <a
              href="/shoe-fit-four-marker-a4.svg"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-[#f0eefb] px-4 text-[11px] font-black text-[#4640DE]"
            >
              측정용지 보기
            </a>
          </div>
        </div>
        <MeasureBottomButton onClick={() => setStep("paperChecklist")}>
          측정용지 준비했어요
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "paperChecklist") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("paperIntro")} />
        <div className="px-7 pt-12">
          <h1 className="text-center text-[18px] font-black leading-7">
            촬영 전 준비 상태를
            <br />
            확인해 주세요
          </h1>
          <p className="mt-3 text-center text-[11px] font-semibold leading-5 text-[#8a8695]">
            아래 조건을 만족해야 OpenCV가 측정용지 마커를 인식할 수 있어요.
          </p>
          <div className="mt-9 space-y-3">
            {[
              "A4 100% 크기로 인쇄했어요",
              "네 개의 검은 마커가 모두 보여요",
              "밝고 평평한 바닥에서 촬영할게요",
            ].map((label, index) => (
              <label
                key={label}
                className="flex min-h-[54px] items-center gap-3 rounded-[12px] bg-white px-4 text-[12px] font-black text-[#3b3944] shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={paperChecks[index]}
                  onChange={(event) => {
                    const next = [...paperChecks];
                    next[index] = event.target.checked;
                    setPaperChecks(next);
                  }}
                  className="h-4 w-4 accent-[#4640DE]"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-6 rounded-[12px] bg-[#f0eefb] p-4 text-[11px] font-bold leading-5 text-[#6b6875]">
            마커가 발에 가려지거나 종이가 구겨지면 측정이 실패할 수 있어요.
          </div>
        </div>
        <MeasureBottomButton
          disabled={!allPaperChecked}
          onClick={() => setStep("consent")}
        >
          다음
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "consent") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("paperChecklist")} />
        <div className="px-7 pt-12">
          <h1 className="text-center text-[17px] font-black leading-6">
            발 분석을 위해
            <br />
            약관에 동의해 주세요
          </h1>
          <p className="mt-3 text-center text-[11px] font-semibold text-[#8a8695]">
            수집된 사진은 AI 분석을 위해서만 사용돼요.
          </p>
          <div className="mt-10 space-y-4">
            {[
              "[필수] 개인정보 수집 및 이용 동의",
              "[필수] 민감 정보 처리 동의",
              "[선택] 서비스 개선용 분석 데이터 활용",
              "전체 동의하기",
            ].map((label, index) => (
              <label
                key={label}
                className="flex items-center gap-3 text-[12px] font-bold text-[#3b3944]"
              >
                <input
                  type="checkbox"
                  checked={consents[index]}
                  onChange={(event) => {
                    const next = [...consents];
                    next[index] = event.target.checked;
                    if (index === 3) {
                      next.fill(event.target.checked);
                    }
                    setConsents(next);
                  }}
                  className="h-4 w-4 accent-[#4640DE]"
                />
                <span>{label}</span>
                <span className="ml-auto text-[10px] text-[#aaa6c7]">보기</span>
              </label>
            ))}
          </div>
        </div>
        <MeasureBottomButton
          disabled={!allConsentChecked}
          onClick={startMeasurementSession}
        >
          동의하고 시작하기
        </MeasureBottomButton>
        {measurementError && (
          <p className="mx-7 mb-4 rounded-[8px] bg-[#ffe8ec] px-4 py-3 text-center text-[11px] font-bold leading-5 text-[#f05464]">
            {measurementError}
          </p>
        )}
        {!allConsentChecked && (
          <button
            type="button"
            onClick={() => setStep("denied")}
            className="mb-8 text-[12px] font-bold text-[#8a84d8]"
          >
            동의 없이 진행하기
          </button>
        )}
      </MeasureFrame>
    );
  }

  if (step === "guide") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("consent")} />
        <div className="px-7 pt-8">
          <h1 className="text-center text-[17px] font-black">촬영준비</h1>
          <img
            src={measureGuideImage}
            alt=""
            className="mt-8 h-[150px] w-full rounded-[8px] object-cover"
          />
          <p className="mt-5 text-center text-[12px] font-bold text-[#1f1d28]">
            실제 측정용지와 화면 가이드를 맞춰 주세요.
          </p>
          <div className="mt-5 space-y-3 rounded-[8px] border border-[#6b5cff] bg-[#f6f4ff] p-3">
            {[
              "A4 측정용지를 바닥에 평평하게 놓아요.",
              "발이 네 개 마커를 가리지 않게 올려요.",
              "카메라 화면에 종이와 발 전체가 모두 들어오게 촬영해요.",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 text-[11px] font-bold text-[#3b3944]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6b5cff] text-[10px] text-white">
                  {index + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <MeasureBottomButton onClick={() => setStep("camera")}>
          모두 읽었어요
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "camera") {
    return (
      <section className="relative flex min-h-dvh flex-col bg-[#17171d] text-white">
        <div className="relative flex h-16 items-center px-5">
          <button
            type="button"
            onClick={() => setStep("guide")}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={25} />
          </button>
          <p className="mx-auto pr-6 text-[12px] font-bold">
            발 사진 촬영 {measurementShots.length + 1}/3
          </p>
          <HomeTopButton
            light
            className="absolute right-5 top-[14px] flex h-9 w-9 items-center justify-end"
          />
        </div>
        <div className="relative mx-auto mt-7 flex h-[420px] w-[286px] items-center justify-center rounded-[18px] border border-white/12 bg-white/5">
          <div className="relative aspect-[210/297] h-[355px] rounded-[10px] border-2 border-[#7168ff] bg-[#7168ff]/8 shadow-[0_0_0_999px_rgba(0,0,0,0.26)]">
            <div className="absolute left-4 top-4 h-7 w-7 rounded-[5px] border border-white/65 bg-white/20" />
            <div className="absolute right-4 top-4 h-7 w-7 rounded-[5px] border border-white/65 bg-white/20" />
            <div className="absolute bottom-4 left-4 h-7 w-7 rounded-[5px] border border-white/65 bg-white/20" />
            <div className="absolute bottom-4 right-4 h-7 w-7 rounded-[5px] border border-white/65 bg-white/20" />
            <div className="absolute left-1/2 top-1/2 h-[190px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/70" />
            <p className="absolute inset-x-0 top-[48%] text-center text-[10px] font-black text-white/70">
              발 중앙을 맞춰주세요
            </p>
          </div>
        </div>
        <p className="mt-5 px-8 text-center text-[11px] font-semibold leading-5 text-white/70">
          {measurementShots.length > 0
            ? `${measurementShots.length}장 완료했어요. 같은 발을 조금 다른 위치에서 다시 촬영해 주세요.`
            : "실제 측정용지의 네 개 마커가 화면 가이드 안에 모두 보이게 맞춰주세요."}
        </p>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleMeasurementImageSelected(file);
            }
          }}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="absolute bottom-10 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#7168ff] bg-white"
          aria-label="촬영"
        />
        <button
          type="button"
          onClick={() => setStep("qualityFail")}
          className="absolute bottom-4 right-5 text-[10px] font-bold text-white/45"
        >
          실패 예시
        </button>
      </section>
    );
  }

  if (step === "processing") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("camera")} />
        <div className="flex flex-1 flex-col items-center px-7 pt-10 text-center">
          <h1 className="text-[17px] font-black">발 영역을 분석하고 있어요.</h1>
          <p className="mt-2 text-[11px] font-semibold text-[#8a8695]">
            {processingMessage}
          </p>
          <div className="relative mt-10">
            <img
              src={measureProcessingImage}
              alt=""
              className="h-[270px] w-[185px] rounded-[12px] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-4 border-[#6b5cff] bg-white/75 text-[12px] font-black text-[#4640DE]">
                65%
              </div>
            </div>
          </div>
        </div>
      </MeasureFrame>
    );
  }

  if (step === "fit") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("processing")} />
        <div className="flex flex-1 flex-col px-7 pt-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#6b5cff]">
            <Check size={30} />
          </div>
          <h1 className="mt-7 text-[18px] font-black">발 분석이 완료됐어요</h1>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-[#8a8695]">
            착화감 선호도를 선택하면 더 정확한 사이즈를 추천해요.
          </p>
          {measurementNotice && (
            <p className="mt-5 rounded-[8px] bg-[#f0eefb] px-4 py-3 text-left text-[10px] font-semibold leading-4 text-[#5d57b7]">
              {measurementNotice}
            </p>
          )}
          <div className="mt-8 rounded-[8px] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black">착화감 선호도 조정하기</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["tight", "딱 맞게"],
                ["normal", "보통"],
                ["loose", "여유있게"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFitPreference(value)}
                  className={`h-10 rounded-[10px] text-[11px] font-black ${
                    fitPreference === value
                      ? "bg-[#4640DE] text-white"
                      : "bg-[#f0eefb] text-[#6f69d8]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <MeasureBottomButton onClick={completeMeasurement}>
          이 착화감으로 조정하기
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "result") {
    const resultProfile = footProfile ?? createMeasuredFootProfile();
    const sizeChoices = getSizeChoices(resultProfile.recommendedSizeMm);
    const summaryItems = getFootProfileSummary(resultProfile);
    const brandRows = getBrandSizeRows(resultProfile);

    return (
      <MeasureFrame scroll>
        <MeasureBackButton onClick={() => setStep("fit")} />
        <div className="border-t-2 border-[#9d65ff]" />
        {saveProfileNotice && (
          <p className="fixed left-1/2 top-12 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#191821] px-5 py-2.5 text-[12px] font-semibold text-white shadow-xl">
            {saveProfileNotice}
          </p>
        )}
        <div className="px-4 pb-[142px] pt-[50px] text-center">
          <header>
            <p className="text-[17px] font-semibold leading-6 text-[#191821]">
              <span className="text-[#4640DE]">{displayUserName}님</span>을 위한
              <br />
              최적의 사이즈
            </p>
            <p className="mt-[14px] text-[10px] font-normal text-[#8a8695]">
              AI분석 결과 당신의 발에 가장 잘 맞는 사이즈 입니다.
            </p>
            <h1 className="mt-[27px] text-[48px] font-bold leading-none text-[#4640DE]">
              {resultProfile.recommendedSizeMm}
              <span className="ml-2 align-baseline text-[17px] font-semibold">
                mm
              </span>
            </h1>
            <div className="mt-[14px] inline-flex h-[28px] items-center rounded-full bg-[#4640DE] px-5 text-[10px] font-semibold text-white">
              적합도 {resultProfile.fitScore}%
            </div>
            <button
              type="button"
              className="mx-auto mt-[8px] flex items-center justify-center gap-1 text-[9px] font-normal text-[#8a84d8]"
            >
              <span className="flex h-[10px] w-[10px] items-center justify-center rounded-full border border-[#8a84d8] text-[7px]">
                ?
              </span>
              왜 이 사이즈 인가요?
            </button>
          </header>

          <section className="mt-[41px] text-left">
            <h2 className="text-[15px] font-semibold text-[#191821]">
              착화감 선택
            </h2>
            <div className="mt-[15px] grid h-[78px] grid-cols-3 rounded-full bg-[#f5f3ff] p-0">
              {sizeChoices.map(({ size, label }) => {
                const active = size === resultProfile.recommendedSizeMm;

                return (
                  <button
                    key={size}
                    type="button"
                    className={`flex flex-col items-center justify-center rounded-full text-center transition-all ${
                      active
                        ? "bg-[#4640DE] text-white"
                        : "text-[#6b5cff]"
                    }`}
                  >
                    <span className="text-[16px] font-semibold leading-none">
                      {size}
                    </span>
                    <span className="mt-[8px] text-[9px] font-normal">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-[29px] text-left">
            <h2 className="text-[15px] font-semibold text-[#191821]">
              사이즈 분석 결과
            </h2>
            <div className="mt-[15px] grid grid-cols-3 gap-[10px]">
              {summaryItems.map((item, index) => (
                <article
                  key={item.label}
                  className="flex h-[101px] flex-col justify-between rounded-[8px] bg-[#f5f3ff] px-4 py-4"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#4640DE]">
                    {index === 0 ? (
                      <Ruler size={17} strokeWidth={1.8} />
                    ) : index === 1 ? (
                      <ScanLine size={17} strokeWidth={1.8} />
                    ) : (
                      <Sparkles size={17} strokeWidth={1.8} />
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-normal text-[#8a8695]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold leading-none text-[#4640DE]">
                      {item.value}
                      {item.unit && (
                        <span className="ml-0.5 text-[9px] font-normal">
                          {item.unit}
                        </span>
                      )}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-[19px] rounded-[8px] bg-[#4640DE] px-4 py-4 text-left text-white">
            <p className="inline-flex h-[26px] items-center rounded-full bg-white px-3 text-[10px] font-semibold text-[#4640DE]">
              AI 분석
            </p>
            <p className="mt-3 text-[11px] font-normal leading-5 text-white">
              {getFootProfileAnalysis(resultProfile)}
            </p>
          </section>

          <div className="mt-[29px] h-px bg-[#4640DE]" />

          <section className="mt-[25px] text-left">
            <h2 className="text-[15px] font-semibold text-[#191821]">
              브랜드별 추천 사이즈
            </h2>
            <div className="mt-[15px] space-y-[14px] px-1">
              {brandRows.map((row) => (
                <div
                  key={row.brand}
                  className="flex items-center justify-between text-[12px] font-normal text-[#191821]"
                >
                  <span>{row.brand}</span>
                  <span className="text-[#6b6875]">{row.size}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mx-auto mt-[22px] flex flex-col items-center text-[10px] font-normal text-[#6b5cff]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[25px] leading-none shadow-sm shadow-[#4640DE]/10">
                +
              </span>
              브랜드 추가하기
            </button>
          </section>

          <section className="-mx-4 mt-[30px] bg-[#f5f3ff] px-4 py-[18px] text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] font-normal text-[#191821]">
                추천 상품
              </h2>
              <button
                type="button"
                className="text-[10px] font-normal text-[#8a8695]"
              >
                더보기
              </button>
            </div>
            <div className="hide-scrollbar mt-[14px] flex gap-3 overflow-x-auto">
              {measurementResultProducts.map((product) => (
                <Link
                  key={product.id}
                  to="/products"
                  className="relative h-[67px] w-[76px] shrink-0 overflow-hidden rounded-[8px] bg-white shadow-sm shadow-[#4640DE]/10"
                >
                  {product.badge && (
                    <span className="absolute left-1 top-1 z-10 rounded-full bg-[#6f66ff] px-1.5 py-0.5 text-[7px] font-normal text-white">
                      {product.badge}
                    </span>
                  )}
                  <img
                    src={product.image}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-2 py-1 text-center text-[8px] font-normal text-white">
                    {product.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[430px] bg-[#FBFAFF] px-4 pb-7 pt-4">
            <button
              type="button"
              disabled={isSavingProfile}
              onClick={() => void handleSaveResult(resultProfile)}
              className="flex h-[54px] w-full items-center justify-center rounded-[16px] bg-[#4640DE] text-[15px] font-normal text-white disabled:opacity-60"
            >
              {isSavingProfile
                ? "저장 중..."
                : `${resultProfile.recommendedSizeMm}mm 사이즈로 저장하기`}
            </button>
            <button
              type="button"
              onClick={() => setStep("start")}
              className="mt-4 text-[12px] font-normal text-[#4640DE] underline"
            >
              다시 측정하기
            </button>
          </div>
        </div>
      </MeasureFrame>
    );
  }

  if (!footProfile) {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => navigate("/home")} />
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#6b5cff]">
            <Ruler size={28} />
          </div>
          <h1 className="mt-7 text-[18px] font-black">
            아직 저장된 발 프로필이 없어요
          </h1>
          <p className="mt-4 text-[11px] font-semibold leading-5 text-[#8a8695]">
            발을 촬영하면 추천 사이즈와 발 프로필을 저장할 수 있어요.
          </p>
        </div>
        <MeasureBottomButton onClick={() => setStep("start")}>
          발 사이즈 측정 시작
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  return (
    <MeasureFrame>
      <MeasureBackButton onClick={() => window.location.assign("/home")} />
      <div className="flex flex-1 flex-col px-7 pt-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#6b5cff]">
          <UserRound size={28} />
        </div>
        <h1 className="mt-7 text-[18px] font-black">
          저장된 발 프로필이 있어요
        </h1>
        <p className="mt-4 text-[11px] font-semibold leading-5 text-[#8a8695]">
          기존 프로필로 쇼핑하거나 새로 측정할 수 있어요.
        </p>
        <div className="mt-8 rounded-[8px] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold text-[#8a8695]">
            최근 측정 사이즈
          </p>
          <p className="mt-2 text-[26px] font-black text-[#4640DE]">
            {footProfile.recommendedSizeMm}mm
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] font-bold text-[#8a8695]">
            <span>{footProfile.recommendedSizeMm}</span>
            <span>{footProfile.footWidthLabel.replace(" D", "")}</span>
            <span>{footProfile.instepLabel}</span>
            <span>{footProfile.footSideLabel || "오른발"}</span>
          </div>
        </div>
      </div>
      <MeasureBottomButton onClick={() => setStep("start")}>
        재촬영하기
      </MeasureBottomButton>
    </MeasureFrame>
  );
}
