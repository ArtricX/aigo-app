import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import type { Story } from '@/lib/api';
import { C } from '@/theme';

const SPEEDS = [0.8, 1, 1.2, 1.5];

const mmss = (sec: number) => {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

type Props = {
  stories: Story[];
  current: number; // 지금 화면에서 보고 있는 소식
  autoPlay?: boolean;
  bottomInset: number;
  // 소리가 다른 소식으로 넘어가면 화면도 그 소식으로 옮겨요.
  onStoryChange: (index: number) => void;
  registerJump: (fn: (index: number) => void) => void;
};

// 소식마다 녹음 파일이 하나씩 있어요. 한 소식이 끝나면 다음 소식으로 이어서 읽어요.
export function Player({ stories, current, autoPlay, bottomInset, onStoryChange, registerJump }: Props) {
  const playable = stories.map((s, i) => (s.audio ? i : -1)).filter((i) => i >= 0);
  const [track, setTrack] = useState(playable[0] ?? 0);
  const [speed, setSpeed] = useState(1);
  const player = useAudioPlayer(stories[playable[0] ?? 0]?.audio?.url ?? null, { updateInterval: 300 });
  const status = useAudioPlayerStatus(player);
  const wantPlay = useRef(!!autoPlay);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, []);

  const go = (i: number, play: boolean) => {
    const url = stories[i]?.audio?.url;
    if (!url) return;
    setTrack(i);
    player.replace({ uri: url });
    player.setPlaybackRate(speed);
    wantPlay.current = play;
    if (play) player.play();
    onStoryChange(i);
  };

  // 위쪽 소식 탭을 눌렀을 때, 듣는 중이면 소리도 그 소식으로 옮겨요.
  useEffect(() => {
    registerJump((i) => {
      if (status.playing && i !== track) go(i, true);
    });
  });

  // 처음 열 때 '듣고 읽기'로 들어왔으면 바로 읽기 시작해요.
  useEffect(() => {
    if (status.isLoaded && wantPlay.current && !status.playing && status.currentTime === 0) {
      player.play();
    }
  }, [status.isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // 한 소식이 끝나면 다음 소식으로
  useEffect(() => {
    if (!status.didJustFinish) return;
    const next = playable.find((i) => i > track);
    if (next !== undefined) go(next, true);
    else wantPlay.current = false;
  }, [status.didJustFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!playable.length) return null;

  const toggle = () => {
    if (status.playing) {
      player.pause();
      wantPlay.current = false;
      return;
    }
    // 보고 있는 소식과 듣는 소식이 다르면, 보고 있는 소식부터 읽어요.
    if (current !== track && stories[current]?.audio) return go(current, true);
    if (status.duration > 0 && status.currentTime >= status.duration - 0.5) player.seekTo(0);
    player.play();
  };
  const step = (d: -1 | 1) => {
    const pos = playable.indexOf(track);
    const target = playable[pos + d];
    if (target !== undefined) go(target, status.playing || wantPlay.current);
  };
  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    player.setPlaybackRate(next);
  };

  const pct = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  const pos = playable.indexOf(track);

  return (
    <View style={{ backgroundColor: C.ink, paddingTop: 10, paddingHorizontal: 16, paddingBottom: bottomInset + 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Txt size={13} weight={700} color="#BDBDBD">
          {mmss(status.currentTime)}
        </Txt>
        <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: '#444444' }}>
          <View style={{ width: `${pct * 100}%`, height: 5, borderRadius: 3, backgroundColor: C.yellow }} />
        </View>
        <Txt size={13} weight={700} color="#BDBDBD">
          {mmss(status.duration)}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={cycleSpeed}
          accessibilityRole="button"
          accessibilityLabel={`읽는 빠르기 ${speed}배, 눌러서 바꾸기`}
          style={{ width: 64, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#6B6B6B', alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={15} weight={700} color={C.paper}>
            {speed.toFixed(1)}배
          </Txt>
        </Pressable>
        <Pressable onPress={() => step(-1)} disabled={pos <= 0} accessibilityRole="button" style={{ width: 64, height: 56, alignItems: 'center', justifyContent: 'center', gap: 2, opacity: pos <= 0 ? 0.35 : 1 }}>
          <Icon name="prev" color={C.paper} />
          <Txt size={12} weight={700} color={C.paper}>
            이전 소식
          </Txt>
        </Pressable>
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={status.playing ? '잠시 멈추기' : '듣기'}
          style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={status.playing ? 'pause' : 'play'} size={24} />
        </Pressable>
        <Pressable
          onPress={() => step(1)}
          disabled={pos >= playable.length - 1}
          accessibilityRole="button"
          style={{ width: 64, height: 56, alignItems: 'center', justifyContent: 'center', gap: 2, opacity: pos >= playable.length - 1 ? 0.35 : 1 }}>
          <Icon name="next" color={C.paper} />
          <Txt size={12} weight={700} color={C.paper}>
            다음 소식
          </Txt>
        </Pressable>
        <View style={{ width: 64 }} />
      </View>
    </View>
  );
}
