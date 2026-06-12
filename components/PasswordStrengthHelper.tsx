interface Props {
  password: string;
  onGenerate: (pwd: string) => void;
}

interface Criterion {
  label: string;
  test: (pwd: string) => boolean;
}

const criteria: Criterion[] = [
  { label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Número", test: (p) => /[0-9]/.test(p) },
  { label: "Símbolo (!@#$%&* etc.)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function generate(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%&*()_+";
  const all = upper + lower + digits + symbols;
  const arr = new Uint32Array(16);
  crypto.getRandomValues(arr);
  const pwd = [
    upper[arr[0] % upper.length],
    lower[arr[1] % lower.length],
    digits[arr[2] % digits.length],
    symbols[arr[3] % symbols.length],
  ];
  for (let i = 4; i < 12; i++) pwd.push(all[arr[i] % all.length]);
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = arr[12] % (i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join("");
}

export default function PasswordStrengthHelper({
  password,
  onGenerate,
}: Props) {
  return (
    <div className="mt-2 rounded-md border border-border bg-bg-subtle p-3 space-y-2">
      <ul className="space-y-1">
        {criteria.map(({ label, test }) => {
          const ok = password.length > 0 && test(password);
          const neutral = password.length === 0;
          return (
            <li key={label} className="flex items-center gap-2 text-xs">
              <span
                className={
                  neutral
                    ? "text-fg-3"
                    : ok
                      ? "text-brand-green"
                      : "text-danger"
                }
              >
                {ok ? "✓" : "✗"}
              </span>
              <span
                className={
                  neutral ? "text-fg-3" : ok ? "text-fg-2" : "text-danger"
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => onGenerate(generate())}
        className="text-xs text-brand-teal hover:underline focus:outline-none"
      >
        Gerar senha segura
      </button>
    </div>
  );
}
