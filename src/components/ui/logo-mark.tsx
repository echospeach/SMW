import { APP_LOGO_URL, C } from "@/lib/theme";

export function LogoMark({ size = 28 }: { size?: number }) {
  if (APP_LOGO_URL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={APP_LOGO_URL}
        alt="SMW"
        className="shrink-0 rounded-md object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md text-sm font-bold"
      style={{ width: size, height: size, background: C.amber, color: C.ink }}
    >
      S
    </div>
  );
}
