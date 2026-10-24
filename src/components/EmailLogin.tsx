// 이메일로 시작하기 (카카오·네이버·구글을 안 쓰는 분용)
// 메일 주소 → 메일로 온 6자리 번호 넣기 → 끝. 비밀번호는 없어요.
// 처음 쓰는 주소면 그대로 가입되고, 쓰던 주소면 로그인돼요.
// 받는 정보는 메일 주소 하나뿐이에요 (메일함 내용은 볼 수 없어요).
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/Txt';
import { Btn } from '@/components/ui';
import { useAccount } from '@/lib/account';
import { emailReady } from '@/lib/auth/providers';
import { C, F, TOUCH } from '@/theme';

const RESEND_SEC = 60;
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

const inputStyle = {
  minHeight: TOUCH + 8,
  borderRadius: 14,
  borderWidth: 1.5,
  borderColor: C.faint,
  backgroundColor: C.paper,
  paddingHorizontal: 16,
  fontFamily: F[400],
  fontSize: 18,
  color: C.ink,
};

export function EmailLogin({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone?: () => void }) {
  const insets = useSafeAreaInsets();
  const { sendEmailCode, verifyEmailCode } = useAccount();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [left, setLeft] = useState(0); // 다시 보내기까지 남은 초
  const codeRef = useRef<React.ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    if (!visible) {
      setStep('email');
      setCode('');
      setMsg(null);
    }
  }, [visible]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const send = async () => {
    if (!emailReady()) return setMsg('이메일로 시작하기는 곧 열려요. 다른 방법을 써 주세요.');
    if (!looksLikeEmail(email)) return setMsg('메일 주소를 다시 확인해 주세요. (예: hong@naver.com)');
    setBusy(true);
    setMsg(null);
    const r = await sendEmailCode(email.trim());
    setBusy(false);
    if (r === 'ok') {
      setStep('code');
      setCode('');
      setLeft(RESEND_SEC);
      setTimeout(() => codeRef.current?.focus(), 300);
    } else if (r === 'wait') setMsg('번호를 방금 보냈어요. 1분쯤 뒤에 다시 눌러 주세요.');
    else if (r === 'mail') setMsg('지금 메일을 보낼 수 없어요. 잠시 뒤에 다시 해 주세요. (메일 발송 문제)');
    else if (r === 'closed') setMsg('지금은 새로 가입할 수 없어요. 잠시 뒤에 다시 해 주세요. (가입 닫힘)');
    else setMsg('번호를 보내지 못했어요. 인터넷 연결을 확인해 주세요.');
  };

  const verify = async (value = code) => {
    if (value.length < 6) return;
    setBusy(true);
    setMsg(null);
    const r = await verifyEmailCode(email.trim(), value);
    setBusy(false);
    if (r === 'ok') {
      onClose();
      onDone?.();
    } else if (r === 'wrong') setMsg('번호가 맞지 않거나 시간이 지났어요. 메일의 번호를 다시 확인하거나 새로 받아 주세요.');
    else if (r === 'wait') setMsg('잠시 뒤에 다시 해 주세요.');
    else setMsg('확인하지 못했어요. 인터넷 연결을 확인해 주세요.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View
          style={{
            backgroundColor: C.ground,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 22,
            paddingBottom: insets.bottom + 20,
            gap: 16,
            width: '100%',
            maxWidth: 430,
            alignSelf: 'center',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt size={22} weight={900} accessibilityRole="header">
              {step === 'email' ? '이메일로 시작하기' : '메일함을 확인해 주세요'}
            </Txt>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" hitSlop={8} style={{ minHeight: TOUCH, minWidth: TOUCH, alignItems: 'flex-end', justifyContent: 'center' }}>
              <Txt size={16} weight={700} color={C.sub}>
                닫기
              </Txt>
            </Pressable>
          </View>

          {step === 'email' ? (
            <>
              <Txt size={16} color="#444444" lh={1.6}>
                {'메일 주소를 적으면 6자리 번호를 보내 드려요.\n비밀번호는 만들지 않아요.'}
              </Txt>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="메일 주소"
                placeholderTextColor={C.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={send}
                accessibilityLabel="메일 주소"
                style={inputStyle}
              />
              {msg && (
                <Txt size={14} weight={700} color={C.warn} lh={1.5}>
                  {msg}
                </Txt>
              )}
              <Btn label={busy ? '보내는 중…' : '번호 받기'} onPress={send} disabled={busy || !email.trim()} />
            </>
          ) : (
            <>
              <Txt size={16} color="#444444" lh={1.6}>
                {`${email.trim()}\n으로 보낸 6자리 번호를 넣어 주세요.`}
              </Txt>
              <TextInput
                ref={codeRef}
                value={code}
                onChangeText={(t) => {
                  const v = t.replace(/\D/g, '').slice(0, 6);
                  setCode(v);
                  if (v.length === 6) verify(v); // 6자리를 다 넣으면 바로 확인
                }}
                placeholder="000000"
                placeholderTextColor={C.faint}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                accessibilityLabel="메일로 받은 6자리 번호"
                style={[inputStyle, { fontFamily: F[900], fontSize: 28, letterSpacing: 8, textAlign: 'center' }]}
              />
              {msg && (
                <Txt size={14} weight={700} color={C.warn} lh={1.5}>
                  {msg}
                </Txt>
              )}
              {busy ? (
                <View style={{ minHeight: TOUCH + 8, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={C.ink} />
                </View>
              ) : (
                <Btn label="확인" onPress={() => verify()} disabled={code.length < 6} />
              )}
              <Txt size={13} color={C.sub} lh={1.5}>
                메일이 안 보이면 스팸함도 확인해 주세요.
              </Txt>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Btn label="메일 주소 바꾸기" kind="ghost" onPress={() => { setStep('email'); setMsg(null); }} />
                <Btn label={left > 0 ? `다시 받기 (${left}초)` : '번호 다시 받기'} kind="ghost" onPress={send} disabled={left > 0 || busy} />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
