/* eslint-disable no-console */
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ButtonComponent, InputComponent } from '../components/base.components';
import { token_cookie_name, useForm } from '../helpers';
import { Encrypt } from '../helpers/encryption.helpers';

const isSafeInternal = (url) => {
  try { 
    return new URL(url, window.location.origin).origin === window.location.origin; 
  } catch { 
    return false; 
  }
};

export default function QrEntry() {
  const router = useRouter();
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [userEmail, setUserEmail] = useState('');
  const [didSubmitRegister, setDidSubmitRegister] = useState(false);

  const onRegisterSuccess = async (data) => {
    if (!didSubmitRegister) return;
    setDidSubmitRegister(false);
    
    if (data?.data?.user?.email) {
      setUserEmail(data.data.user.email);
      
      // ✅ SIMPAN TOKEN LANGSUNG SETELAH REGISTER
      const token = data?.data?.user_token;
      if (token) {
        try {
          const cookieOpts = { expires: 365, secure: process.env.NODE_ENV === 'production' };
          Cookies.set(token_cookie_name, Encrypt(token), cookieOpts);
          localStorage.setItem('auth_token', token);
        } catch (e) {
          console.error('Failed to save token:', e);
        }
        
        // ✅ HANDLE KOMUNITAS QR SCAN - Check if user can skip verification for public communities
        const qrData = router.query.qr_data;
        if (qrData && data?.data?.user?.email_verified_at) {
          try {
            // If email is already verified and it's a community QR, handle it immediately
            const joinMatch = qrData.match(/\/app\/komunitas\/join\/(\d+)/);
            if (joinMatch) {
              const communityId = joinMatch[1];
              const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
              const apiBase = baseUrl.replace(/\/api\/?$/, '');
              
              const communityRes = await fetch(`${apiBase}/api/communities/${communityId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (communityRes.ok) {
                const communityJson = await communityRes.json();
                const community = communityJson.data || communityJson;
                
                const rawPrivacy = String(
                  community?.privacy ?? community?.world_type ?? community?.type ?? ''
                ).toLowerCase();
                const privacy = rawPrivacy === 'pribadi' ? 'private' : (rawPrivacy || 'public');
                const isPublic = privacy === 'public';
                
                if (isPublic) {
                  try {
                    const joinRes = await fetch(`${apiBase}/api/communities/${communityId}/join`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    
                    if (joinRes.ok || joinRes.status === 422) {
                      try {
                        localStorage.setItem(
                          'community:membership',
                          JSON.stringify({
                            id: Number(communityId),
                            action: 'join',
                            delta: +1,
                            at: Date.now()
                          })
                        );
                      } catch {}
                      
                      console.log('🔐 QR Register Success - Redirecting to community dashboard:', communityId);
                      window.location.href = `/app/komunitas/dashboard/${communityId}`;
                      return;
                    }
                  } catch (joinError) {
                    console.error('Failed to auto-join during registration:', joinError);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Failed to handle community QR during registration:', error);
          }
        }
      }
      
      setStep('verify');
    }
  };

  const onVerifySuccess = async (data) => {
    // ✅ SIMPAN TOKEN SETELAH VERIFIKASI
    const token = data?.data?.token || data?.data?.user_token;
    if (token) {
      try {
        const cookieOpts = { expires: 365, secure: process.env.NODE_ENV === 'production' };
        Cookies.set(token_cookie_name, Encrypt(token), cookieOpts);
        localStorage.setItem('auth_token', token);
      } catch (e) {
        console.error('Failed to save token:', e);
      }
    }

    // ✅ HANDLE KOMUNITAS QR SCAN
    const qrData = router.query.qr_data;
    if (qrData && token) {
      try {
        // Extract community ID from QR data if it's a community join URL
        const joinMatch = qrData.match(/\/app\/komunitas\/join\/(\d+)/);
        if (joinMatch) {
          const communityId = joinMatch[1];
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const apiBase = baseUrl.replace(/\/api\/?$/, '');
          
          // Check community privacy before redirecting
          const communityRes = await fetch(`${apiBase}/api/communities/${communityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (communityRes.ok) {
            const communityJson = await communityRes.json();
            const community = communityJson.data || communityJson;
            
            // Check if it's public community
            const rawPrivacy = String(
              community?.privacy ?? community?.world_type ?? community?.type ?? ''
            ).toLowerCase();
            const privacy = rawPrivacy === 'pribadi' ? 'private' : (rawPrivacy || 'public');
            const isPublic = privacy === 'public';
            
            if (isPublic) {
              // For public communities, try to join first, then redirect to dashboard
              try {
                const joinRes = await fetch(`${apiBase}/api/communities/${communityId}/join`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                });
                
                if (joinRes.ok || joinRes.status === 422) { // 422 = already joined
                  // Update localStorage for community membership sync
                  try {
                    localStorage.setItem(
                      'community:membership',
                      JSON.stringify({
                        id: Number(communityId),
                        action: 'join',
                        delta: +1,
                        at: Date.now()
                      })
                    );
                  } catch {}
                  
                  // Redirect to community dashboard for public communities
                  console.log('🔐 QR Entry Success - Redirecting to community dashboard:', communityId);
                  window.location.href = `/app/komunitas/dashboard/${communityId}`;
                  return;
                }
              } catch (joinError) {
                console.error('Failed to auto-join public community:', joinError);
              }
            }
            
            // For private communities or join failed, redirect to join page
            console.log('🔐 QR Entry Success - Redirecting to join page:', communityId);
            window.location.href = `/app/komunitas/join/${communityId}`;
            return;
          }
        }
      } catch (error) {
        console.error('Failed to handle community QR scan:', error);
      }
    }

    // ✅ FALLBACK: REDIRECT KE URL YANG AMAN
    const redirectUrl = data?.data?.redirect_url;
    const target = (redirectUrl && isSafeInternal(redirectUrl)) ? redirectUrl : '/app';
    
    console.log('🔐 QR Entry Success - Redirecting to:', target);
    window.location.href = target;
  };

  const [{ formControl: registerFormControl, submit: registerSubmit, loading: registerLoading }] = useForm(
    {
      path: 'qr-entry/register',
      data: {
        qr_data: router.query.qr_data || null,
      }
    },
    false,
    onRegisterSuccess
  );

  const [{ formControl: verifyFormControl, submit: verifySubmit, loading: verifyLoading }] = useForm(
    {
      path: 'qr-entry/verify',
      data: {
        email: userEmail,
        qr_data: router.query.qr_data || null,
      }
    },
    false,
    onVerifySuccess
  );

  if (step === 'register') {
    return (
      <div className="container mx-auto max-w-md p-4">
        <h1 className="text-2xl font-bold mb-4">QR Entry Registration</h1>
        <form
          onSubmit={(e) => {
            setDidSubmitRegister(true);
            registerSubmit(e);
          }}
          className="space-y-4"
        >
          <InputComponent
            name="name"
            label="Nama Lengkap"
            {...registerFormControl('name')}
            validations={{ required: true }}
          />
          <InputComponent
            name="email"
            label="Email"
            type="email"
            {...registerFormControl('email')}
            validations={{ required: true, email: true }}
          />
          <InputComponent
            name="phone"
            label="No HP/WA"
            {...registerFormControl('phone')}
            validations={{ required: true }}
          />
          <InputComponent
            name="password"
            label="Password"
            type="password"
            {...registerFormControl('password')}
            validations={{ required: true, min: 8 }}
          />
          <InputComponent
            name="password_confirmation"
            label="Konfirmasi Password"
            type="password"
            {...registerFormControl('password_confirmation')}
            validations={{ required: true }}
          />
          <ButtonComponent
            type="submit"
            label="Daftar"
            block
            loading={registerLoading}
          />
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold mb-4">Verifikasi Email</h1>
      <p className="mb-4">Kode verifikasi telah dikirim ke {userEmail}</p>
      <form onSubmit={verifySubmit} className="space-y-4">
        <InputComponent
          name="code"
          label="Kode Verifikasi"
          placeholder="Masukkan 6 digit kode"
          {...verifyFormControl('code')}
          validations={{ required: true, min: 6, max: 6 }}
        />
        <ButtonComponent
          type="submit"
          label="Verifikasi"
          block
          loading={verifyLoading}
        />
      </form>
    </div>
  );
}