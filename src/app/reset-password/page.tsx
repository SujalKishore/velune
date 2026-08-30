"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, Eye } from "lucide-react";
import styles from "../login/page.module.css";
import { changePassword } from "../actions/auth";
import Logo from "@/components/Logo";

export default function ResetPassword() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("token") || "");
      setEmail(params.get("email") || "");
    }
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    formData.append("token", token);
    formData.append("email", email);

    const result = await changePassword(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/login");
    }
  }

  if (typeof window !== "undefined" && (!token || !email)) {
    return (
      <main className={styles.pageWrapper}>
         <div className={styles.container} style={{display:'flex',justifyContent:'center',alignItems:'center', height:'100vh', color: 'white'}}>
            <div style={{textAlign: 'center'}}>
               <Logo size={32} />
               <h2 style={{marginTop: '20px', fontFamily: 'Sora, sans-serif'}}>Invalid reset link.</h2>
            </div>
         </div>
      </main>
    );
  }

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.container} style={{maxWidth: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>
        <div className={styles.loginCard} style={{flexDirection: 'column', padding: '40px', width: '100%', height: 'auto', gridTemplateColumns: '1fr', display: 'flex'}}>
          <div className={styles.brandTop} style={{position: 'static', marginBottom: '24px', alignSelf: 'flex-start'}}>
            <Logo size={24} />
          </div>
          <div className={styles.header} style={{marginBottom: '32px'}}>
             <h2 className={styles.loginTitle} style={{fontSize: '28px'}}>Set New Password</h2>
             <p className={styles.loginSub}>Enter your new password below for <b>{email}</b>.</p>
          </div>

          <form action={onSubmit} className={styles.form} style={{width: '100%'}}>
            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>NEW PASSWORD</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input type="password" name="password" placeholder="Enter new password" required style={{width: '100%'}} />
                <Eye size={18} className={styles.eyeIcon} />
              </div>
            </div>

            <div className={styles.formActions} style={{marginTop: '32px'}}>
              <button type="submit" className={styles.submitBtn} disabled={loading} style={{width: '100%'}}>
                {loading ? "SAVING..." : "UPDATE PASSWORD"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
