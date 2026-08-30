"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, AlertCircle, Eye } from "lucide-react";
import styles from "./page.module.css";
import { loginUser, registerUser, resetPassword, googleAuthLogin } from "../actions/auth";
import Logo from "@/components/Logo";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "register") {
        setIsLogin(false);
      }
    }
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    if (isForgotPassword) {
      const result = await resetPassword(formData.get("email") as string);
      if (result.error) {
         setError(result.error);
      } else {
         setSuccessMsg("If an account exists, a reset link has been sent.");
      }
      setLoading(false);
      return;
    }

    const action = isLogin ? loginUser : registerUser;
    const result = await action(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  async function handleGoogleSuccess(credentialResponse: any) {
    if (!credentialResponse.credential) return;
    setLoading(true);
    const result = await googleAuthLogin(credentialResponse.credential);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id"}>
      <main className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          
          {/* Left Panel */}
          <div className={styles.leftPanel}>
            <div className={styles.leftOverlay}></div>
            
            <div className={styles.brandTop}>
              <Logo size={24} />
            </div>
            
            <div className={styles.leftContent}>
              <h1 className={styles.welcomeTitle}>{isLogin ? "Welcome back." : "Join us."}</h1>
              <p className={styles.welcomeDesc}>
                {isLogin 
                  ? "Log in to continue your cinematic journey." 
                  : "Create an account to start tracking your cinematic journey."}
              </p>
            </div>

            <div className={styles.quoteBlock}>
              <p>"We watch.<br/>We feel.<br/>We remember."</p>
            </div>

            {/* Middle Bridging Tabs */}
            <div className={styles.tabBridge}>
              <div 
                className={`${styles.tabBtn} ${isLogin && !isForgotPassword ? styles.tabActive : ''}`}
                onClick={() => { setIsLogin(true); setIsForgotPassword(false); setError(null); setSuccessMsg(null); }}
              >
                LOGIN
              </div>
              <div 
                className={`${styles.tabBtn} ${!isLogin && !isForgotPassword ? styles.tabActive : ''}`}
                onClick={() => { setIsLogin(false); setIsForgotPassword(false); setError(null); setSuccessMsg(null); }}
              >
                SIGN UP
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className={styles.rightPanel}>
            <div className={styles.header}>
              <div className={styles.userIconWrap}>
                <User size={28} strokeWidth={1.5} />
              </div>
              <h2 className={styles.loginTitle}>{isForgotPassword ? "Reset Password" : (isLogin ? "Login" : "Sign Up")}</h2>
              <p className={styles.loginSub}>
                {isForgotPassword 
                  ? "Enter your email to receive a reset link." 
                  : (isLogin ? "Welcome back! Please enter your details." : "Welcome! Please enter your details.")}
              </p>
            </div>

            <form action={onSubmit} className={styles.form}>
              {error && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}
              {successMsg && (
                <div className={styles.successAlert} style={{ background: 'rgba(0, 229, 197, 0.1)', color: '#00E5C5', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <AlertCircle size={18} /> {successMsg}
                </div>
              )}
              
              {!isLogin && !isForgotPassword && (
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>FULL NAME</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input type="text" name="name" placeholder="Enter your full name" required />
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>EMAIL</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input type="email" name="email" placeholder="Enter your email" required />
                </div>
              </div>

              {!isForgotPassword && (
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.inputLabel}>PASSWORD</label>
                    {isLogin && <a href="#" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setError(null); setSuccessMsg(null); }}>Forgot Password?</a>}
                  </div>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input type="password" name="password" placeholder="Enter your password" required />
                    <Eye size={18} className={styles.eyeIcon} />
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? "..." : (isForgotPassword ? "SEND RESET LINK" : (isLogin ? "LOGIN" : "SIGN UP"))}
                </button>
                {isForgotPassword && (
                  <button type="button" onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMsg(null); }} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', marginTop: '16px', fontSize: '13px', fontWeight: 'bold' }}>
                    BACK TO LOGIN
                  </button>
                )}
              </div>
            </form>

            {!isForgotPassword && (
              <div className={styles.footer}>
                <div className={styles.divider}>
                  <span>OR {isLogin ? "LOGIN" : "SIGN UP"} WITH</span>
                </div>
                <div className={styles.socialLogin}>
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess} 
                    onError={() => setError("Google Login Failed")} 
                    shape="pill"
                  />
                  <div className={styles.socialBtn}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" width={16} alt="Facebook" /> Facebook
                  </div>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </main>
    </GoogleOAuthProvider>
  );
}
