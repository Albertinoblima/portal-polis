"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pollAccessToken, requestDeviceCode, type DeviceCodeResponse } from "@/lib/github/deviceAuth";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/Button";

type Stage = "idle" | "waiting" | "success" | "error";

export default function AdminLoginPage() {
  const router = useRouter();
  const { applyToken } = useSession();
  const [stage, setStage] = useState<Stage>("idle");
  const [device, setDevice] = useState<DeviceCodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

  async function handleStart() {
    setError(null);
    setStage("waiting");
    try {
      const deviceCode = await requestDeviceCode();
      setDevice(deviceCode);
      schedulePoll(deviceCode.device_code, deviceCode.interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o login.");
      setStage("error");
    }
  }

  function schedulePoll(deviceCode: string, intervalSeconds: number) {
    pollTimer.current = window.setTimeout(async () => {
      const result = await pollAccessToken(deviceCode);
      if (result.status === "pending") {
        schedulePoll(deviceCode, intervalSeconds);
        return;
      }
      if (result.status === "slow_down") {
        schedulePoll(deviceCode, result.interval);
        return;
      }
      if (result.status === "error") {
        setError(result.message);
        setStage("error");
        return;
      }

      try {
        await applyToken(result.accessToken);
        setStage("success");
        router.replace("/admin/dashboard/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível concluir o login.");
        setStage("error");
      }
    }, intervalSeconds * 1000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-polis-navy px-4">
      <div className="w-full max-w-sm rounded-sm bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <Image src="/brand/LOGO_MARCA.png" alt="Pólis" width={56} height={56} className="h-14 w-14" />
          <h1 className="font-sans text-xl font-bold text-polis-navy">Painel Administrativo</h1>
          <p className="text-center text-sm text-polis-slate">
            O acesso é feito com sua conta do GitHub — é preciso ser colaborador do repositório com
            permissão de escrita.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {stage === "idle" && (
            <Button type="button" onClick={handleStart} className="w-full">
              Entrar com GitHub
            </Button>
          )}

          {stage === "waiting" && !device && <p className="text-center text-sm text-polis-slate">Preparando...</p>}

          {stage === "waiting" && device && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-polis-slate">
                Acesse{" "}
                <a
                  href={device.verification_uri}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-polis-gold hover:underline"
                >
                  {device.verification_uri}
                </a>{" "}
                e digite o código abaixo:
              </p>
              <p className="rounded-sm bg-polis-off-white px-4 py-3 font-mono text-2xl font-bold tracking-widest text-polis-navy">
                {device.user_code}
              </p>
              <p className="text-xs text-polis-slate">Aguardando autorização...</p>
            </div>
          )}

          {stage === "success" && <p className="text-center text-sm text-polis-slate">Entrando...</p>}

          {error && (
            <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {stage === "error" && (
            <Button type="button" onClick={handleStart} className="w-full">
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
