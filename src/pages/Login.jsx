import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../assets/imgs/logo.png";
import api from "../services/axios";

const BRAND_NAME = "O'quv markaz 770";

const initialFormData = {
  phone: '',
  password: '',
};

const initialForgotState = {
  phone: '',
  otp: '',
  password: '',
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 disabled:bg-slate-100";

const EyeIcon = ({ off }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {off ? (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </>
    ) : (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('phone');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotForm, setForgotForm] = useState(initialForgotState);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const slideTransition = (props) => <Slide {...props} direction="left" />;

  useEffect(() => {
    if (!forgotOpen || forgotStep !== 'otp' || secondsLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [forgotOpen, forgotStep, secondsLeft]);

  const resetForgotFlow = () => {
    setForgotStep('phone');
    setForgotLoading(false);
    setForgotError('');
    setForgotMessage('');
    setForgotForm(initialForgotState);
    setSecondsLeft(60);
  };

  const openForgotModal = () => {
    resetForgotFlow();
    setForgotOpen(true);
  };

  const closeForgotModal = () => {
    setForgotOpen(false);
    resetForgotFlow();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotForm((prev) => ({ ...prev, [name]: value }));
    setForgotError('');
    setForgotMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setErrorOpen(false);
    setSuccessOpen(false);

    if (!formData.phone || !formData.password) {
      setError('Iltimos, barcha maydonlarni to\'ldiring');
      setErrorOpen(true);
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/login", {
        phone: formData.phone,
        password: formData.password,
      });

      if (response.data.success) {
        const token = response.data.accessToken;
        const role = response.data.role || response.data.data?.role || '';
        const userData = response.data.data;

        login(token, role, userData);
        setSuccessMessage("Tizimga muvaffaqiyatli kirdingiz!");
        setSuccessOpen(true);

        window.setTimeout(() => {
          if (role === 'TEACHER') {
            navigate('/teacher/groups');
          } else if (role === 'STUDENT') {
            navigate('/student/groups');
          } else {
            navigate('/dashboard');
          }
        }, 900);
      }
    } catch (requestError) {
      const errorMessage = requestError.response?.data?.message || "Login yoki parol noto'g'ri!";
      setError(errorMessage);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!forgotForm.phone) {
      setForgotError('Telefon raqamni kiriting');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      await api.post('/auth/send-otp', {
        phone: forgotForm.phone,
      });
      setForgotStep('otp');
      setSecondsLeft(60);
      setForgotMessage('Tasdiqlash kodi yuborildi');
    } catch (requestError) {
      setForgotError(requestError.response?.data?.message || 'SMS yuborilmadi');
    } finally {
      setForgotLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!forgotForm.otp) {
      setForgotError('SMS kodni kiriting');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      await api.post('/auth/verify-otp', {
        phone: forgotForm.phone,
        otp: forgotForm.otp,
      });
      setForgotStep('password');
      setForgotMessage('Kod tasdiqlandi. Yangi parol kiriting');
    } catch (requestError) {
      setForgotError(requestError.response?.data?.message || 'Kod noto\'g\'ri');
    } finally {
      setForgotLoading(false);
    }
  };

  const changePassword = async () => {
    if (!forgotForm.password) {
      setForgotError('Yangi parolni kiriting');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      await api.put('/auth/change-password', {
        phone: forgotForm.phone,
        password: forgotForm.password,
      });
      setForgotMessage('Parol muvaffaqiyatli yangilandi');
      setTimeout(() => {
        closeForgotModal();
      }, 1200);
    } catch (requestError) {
      setForgotError(requestError.response?.data?.message || 'Parol yangilanmadi');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-full bg-[#f4f4fb]">
      {/* Chap panel: brend */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0a1230] p-12 lg:flex">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-orange-500/15 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img src={Logo} alt={BRAND_NAME} className="h-12 w-12 rounded-full" />
          <span className="text-xl font-bold tracking-tight text-orange-400">{BRAND_NAME}</span>
        </div>

        <div className="relative max-w-xl">
          <h2 className="text-xl font-bold leading-tight tracking-tight text-white">
            O'quvchilaringiz va darslaringiz —{' '}
            <span className="text-orange-400">bir joyda</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-400">
            Har bir guruh, har bir dars va har bir o'quvchi nazoratda. Tizimga kiring va ishni davom ettiring.
          </p>
        </div>

        <p className="relative font-mono text-sm text-slate-500">
          © {new Date().getFullYear()} {BRAND_NAME}
        </p>
      </div>

      {/* O'ng panel: forma */}
      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 sm:p-10">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src={Logo} alt={BRAND_NAME} className="h-11 w-11 rounded-full" />
            <span className="text-xl font-bold text-slate-900">{BRAND_NAME}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-shadow-indigo-950">Tizimga kirish</h1>
          <p className="mt-2 text-slate-500">Hisobingizga kirish uchun ma'lumotlarni kiriting</p>

          <form onSubmit={handleSubmit} className="mt-8 text-left">
            <div className="mb-5">
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-800">
                Telefon raqam
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="username"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+998901234567"
                className={inputClass}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                Parol
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Parolni kiriting"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700"
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-end">
              <button
                type="button"
                onClick={openForgotModal}
                className="text-sm font-medium text-orange-600 transition hover:text-orange-700 hover:underline"
              >
                Parolni unutdingizmi?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0a1230] px-4 py-3.5 font-semibold text-white transition hover:bg-[#14204d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Yuklanmoqda...' : 'Kirish'}
            </button>
          </form>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Parolni tiklash</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Telefon raqam, SMS kod va yangi parol orqali tiklash.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {forgotError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {forgotError}
                </div>
              )}

              {forgotMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {forgotMessage}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Telefon raqam
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={forgotForm.phone}
                  onChange={handleForgotChange}
                  placeholder="+998901234567"
                  disabled={forgotStep !== 'phone'}
                  className={inputClass}
                />
              </div>

              {forgotStep === 'phone' && (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={forgotLoading}
                  className="w-full rounded-xl bg-[#0a1230] px-4 py-3.5 font-semibold text-white transition hover:bg-[#14204d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotLoading ? 'SMS yuborilmoqda...' : 'SMS kod yuborish'}
                </button>
              )}

              {forgotStep === 'otp' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      SMS kod
                    </label>
                    <input
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      value={forgotForm.otp}
                      onChange={handleForgotChange}
                      placeholder="123456"
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {secondsLeft > 0 ? `Qolgan vaqt: ${secondsLeft} soniya` : 'SMS vaqti tugadi'}
                    </span>
                    {secondsLeft === 0 && (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={forgotLoading}
                        className="font-medium text-orange-600 transition hover:text-orange-700 hover:underline"
                      >
                        Qayta SMS yuborish
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={forgotLoading}
                    className="w-full rounded-xl bg-[#0a1230] px-4 py-3.5 font-semibold text-white transition hover:bg-[#14204d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotLoading ? 'Tekshirilmoqda...' : 'SMS kodni tasdiqlash'}
                  </button>
                </>
              )}

              {forgotStep === 'password' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Yangi parol
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={forgotForm.password}
                      onChange={handleForgotChange}
                      placeholder="Yangi parol"
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={changePassword}
                    disabled={forgotLoading}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotLoading ? 'Yangilanmoqda...' : 'Parolni yangilash'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Snackbar
        open={errorOpen}
        autoHideDuration={3000}
        onClose={() => setErrorOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={slideTransition}
      >
        <Alert
          onClose={() => setErrorOpen(false)}
          severity="error"
          sx={{
            width: '100%',
            bgcolor: '#e81411ff',
            color: '#fff',
            '& .MuiAlert-icon': { color: '#fff' },
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={successOpen}
        autoHideDuration={2000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={slideTransition}
      >
        <Alert
          onClose={() => setSuccessOpen(false)}
          severity="success"
          sx={{
            width: '100%',
            bgcolor: '#0fbe18ff',
            color: '#fff',
            '& .MuiAlert-icon': { color: '#fff' },
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
