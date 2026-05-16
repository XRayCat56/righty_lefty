import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types';

type GameplayScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Gameplay'>;
};

const BALL_SIZE = 30;
/** Time to roll across the full span (left wall to right wall) at nominal speed; shorter hops scale down proportionally. */
const BALL_FULL_TRAVERSE_MS = 1500;
const FALLING_OBJECT_SIZE = 24;
const FALL_DURATION_MS = 3000;
const MIN_FALL_DURATION_MS = 500;
const SPEED_UP_EVERY = 5;
const SPEED_UP_FACTOR = 0.85;
const BALL_VERTICAL_CENTER_PCT = 0.85;

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function GameplayScreen({ navigation }: GameplayScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [leftBallMovesRight, setLeftBallMovesRight] = useState(false);
  const [rightBallMovesRight, setRightBallMovesRight] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [fallRestartKey, setFallRestartKey] = useState(0);
  const playingRef = useRef(true);
  const leftBallX = useRef(new Animated.Value(0)).current;
  const rightBallX = useRef(new Animated.Value(0)).current;
  const leftFallX = useRef(new Animated.Value(0)).current;
  const leftFallY = useRef(new Animated.Value(-FALLING_OBJECT_SIZE)).current;
  const rightFallX = useRef(new Animated.Value(0)).current;
  const rightFallY = useRef(new Animated.Value(-FALLING_OBJECT_SIZE)).current;
  const passedCountRef = useRef(0);
  const fallDurationRef = useRef(FALL_DURATION_MS);
  const gameOverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef({
    leftFallX: 0,
    leftFallY: -FALLING_OBJECT_SIZE,
    leftBallX: 0,
    rightFallX: 0,
    rightFallY: -FALLING_OBJECT_SIZE,
    rightBallX: 0,
  });

  const halfWidth = width / 2;

  const maxHorizontalTravel = useMemo(() => {
    const halfScreenWidth = width / 2;
    return Math.max(halfScreenWidth / 2 - BALL_SIZE / 2, 0);
  }, [width]);

  useEffect(() => {
    if (gameOver) {
      leftBallX.stopAnimation();
      return;
    }
    const toValue = leftBallMovesRight ? maxHorizontalTravel : -maxHorizontalTravel;
    const fullRangePx = 2 * maxHorizontalTravel;
    const speedPxPerSec =
      fullRangePx > 0 && BALL_FULL_TRAVERSE_MS > 0
        ? fullRangePx / (BALL_FULL_TRAVERSE_MS / 1000)
        : 0;

    let cancelled = false;
    leftBallX.stopAnimation((current) => {
      if (cancelled) return;
      const distancePx = Math.abs(toValue - current);
      const durationMs =
        speedPxPerSec > 0 ? Math.max(0, (distancePx / speedPxPerSec) * 1000) : 0;
      Animated.timing(leftBallX, {
        toValue,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      cancelled = true;
      leftBallX.stopAnimation();
    };
  }, [gameOver, leftBallMovesRight, leftBallX, maxHorizontalTravel]);

  useEffect(() => {
    if (gameOver) {
      rightBallX.stopAnimation();
      return;
    }
    const toValue = rightBallMovesRight ? maxHorizontalTravel : -maxHorizontalTravel;
    const fullRangePx = 2 * maxHorizontalTravel;
    const speedPxPerSec =
      fullRangePx > 0 && BALL_FULL_TRAVERSE_MS > 0
        ? fullRangePx / (BALL_FULL_TRAVERSE_MS / 1000)
        : 0;

    let cancelled = false;
    rightBallX.stopAnimation((current) => {
      if (cancelled) return;
      const distancePx = Math.abs(toValue - current);
      const durationMs =
        speedPxPerSec > 0 ? Math.max(0, (distancePx / speedPxPerSec) * 1000) : 0;
      Animated.timing(rightBallX, {
        toValue,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      cancelled = true;
      rightBallX.stopAnimation();
    };
  }, [gameOver, rightBallMovesRight, rightBallX, maxHorizontalTravel]);

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    return () => {
      void ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (gameOverTimeoutRef.current != null) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
    };
  }, []);

  const triggerGameOver = useCallback(() => {
    if (!playingRef.current) return;
    playingRef.current = false;
    if (gameOverTimeoutRef.current != null) {
      clearTimeout(gameOverTimeoutRef.current);
    }
    gameOverTimeoutRef.current = setTimeout(() => {
      gameOverTimeoutRef.current = null;
      leftFallY.stopAnimation();
      rightFallY.stopAnimation();
      leftBallX.stopAnimation();
      rightBallX.stopAnimation();
      setGameOver(true);
    }, 0);
  }, [leftBallX, leftFallY, rightBallX, rightFallY]);

  useEffect(() => {
    if (gameOver || height <= 0 || width <= 0) return;

    const checkCollisions = () => {
      if (!playingRef.current) return;
      const p = posRef.current;
      const ballCy = height * BALL_VERTICAL_CENTER_PCT;
      const ballTop = ballCy - BALL_SIZE / 2;
      const ballH = BALL_SIZE;

      const leftBallLeft = width * 0.25 - BALL_SIZE / 2 + p.leftBallX;
      if (
        rectsOverlap(
          p.leftFallX,
          p.leftFallY,
          FALLING_OBJECT_SIZE,
          FALLING_OBJECT_SIZE,
          leftBallLeft,
          ballTop,
          BALL_SIZE,
          ballH,
        )
      ) {
        triggerGameOver();
        return;
      }

      const rightFallScreenX = halfWidth + p.rightFallX;
      const rightBallLeft = width * 0.75 - BALL_SIZE / 2 + p.rightBallX;
      if (
        rectsOverlap(
          rightFallScreenX,
          p.rightFallY,
          FALLING_OBJECT_SIZE,
          FALLING_OBJECT_SIZE,
          rightBallLeft,
          ballTop,
          BALL_SIZE,
          ballH,
        )
      ) {
        triggerGameOver();
      }
    };

    const idLeftFallX = leftFallX.addListener(({ value }) => {
      posRef.current.leftFallX = value;
      checkCollisions();
    });
    const idLeftFallY = leftFallY.addListener(({ value }) => {
      posRef.current.leftFallY = value;
      checkCollisions();
    });
    const idLeftBallX = leftBallX.addListener(({ value }) => {
      posRef.current.leftBallX = value;
      checkCollisions();
    });
    const idRightFallX = rightFallX.addListener(({ value }) => {
      posRef.current.rightFallX = value;
      checkCollisions();
    });
    const idRightFallY = rightFallY.addListener(({ value }) => {
      posRef.current.rightFallY = value;
      checkCollisions();
    });
    const idRightBallX = rightBallX.addListener(({ value }) => {
      posRef.current.rightBallX = value;
      checkCollisions();
    });

    return () => {
      leftFallX.removeListener(idLeftFallX);
      leftFallY.removeListener(idLeftFallY);
      leftBallX.removeListener(idLeftBallX);
      rightFallX.removeListener(idRightFallX);
      rightFallY.removeListener(idRightFallY);
      rightBallX.removeListener(idRightBallX);
    };
  }, [
    gameOver,
    width,
    height,
    halfWidth,
    leftFallX,
    leftFallY,
    leftBallX,
    rightFallX,
    rightFallY,
    rightBallX,
    triggerGameOver,
  ]);

  useEffect(() => {
    playingRef.current = true;
    let cancelled = false;
    const maxFallX = Math.max(halfWidth - FALLING_OBJECT_SIZE, 0);

    const runFall = (xValue: Animated.Value, yValue: Animated.Value) => {
      if (cancelled || !playingRef.current) return;
      xValue.setValue(Math.random() * maxFallX);
      yValue.setValue(-FALLING_OBJECT_SIZE);
      Animated.timing(yValue, {
        toValue: height,
        duration: fallDurationRef.current,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !cancelled && playingRef.current) {
          setScore((s) => s + 1);
          passedCountRef.current += 1;
          if (passedCountRef.current % SPEED_UP_EVERY === 0) {
            fallDurationRef.current = Math.max(
              fallDurationRef.current * SPEED_UP_FACTOR,
              MIN_FALL_DURATION_MS,
            );
          }
          runFall(xValue, yValue);
        }
      });
    };

    runFall(leftFallX, leftFallY);
    runFall(rightFallX, rightFallY);

    return () => {
      cancelled = true;
      leftFallY.stopAnimation();
      rightFallY.stopAnimation();
    };
  }, [
    fallRestartKey,
    halfWidth,
    height,
    leftFallX,
    leftFallY,
    rightFallX,
    rightFallY,
  ]);

  const handlePlayAgain = () => {
    if (gameOverTimeoutRef.current != null) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }

    const travel = Math.max(width / 4 - BALL_SIZE / 2, 0);
    const hw = width / 2;
    const maxFallX = Math.max(hw - FALLING_OBJECT_SIZE, 0);
    const leftFx = Math.random() * maxFallX;
    const rightFx = Math.random() * maxFallX;

    leftFallX.setValue(leftFx);
    leftFallY.setValue(-FALLING_OBJECT_SIZE);
    rightFallX.setValue(rightFx);
    rightFallY.setValue(-FALLING_OBJECT_SIZE);
    leftBallX.setValue(-travel);
    rightBallX.setValue(-travel);

    posRef.current.leftFallX = leftFx;
    posRef.current.leftFallY = -FALLING_OBJECT_SIZE;
    posRef.current.leftBallX = -travel;
    posRef.current.rightFallX = rightFx;
    posRef.current.rightFallY = -FALLING_OBJECT_SIZE;
    posRef.current.rightBallX = -travel;

    playingRef.current = true;
    passedCountRef.current = 0;
    fallDurationRef.current = FALL_DURATION_MS;
    setLeftBallMovesRight(false);
    setRightBallMovesRight(false);
    setScore(0);
    setGameOver(false);
    setFallRestartKey((k) => k + 1);
  };

  return (
    <View style={styles.root}>
      <Pressable
        style={styles.leftTouchZone}
        disabled={gameOver}
        onPress={() => setLeftBallMovesRight((prev) => !prev)}
      />
      <Pressable
        style={styles.rightTouchZone}
        disabled={gameOver}
        onPress={() => setRightBallMovesRight((prev) => !prev)}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.fallingObject,
          { left: 0, transform: [{ translateX: leftFallX }, { translateY: leftFallY }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fallingObject,
          { left: halfWidth, transform: [{ translateX: rightFallX }, { translateY: rightFallY }] },
        ]}
      />

      <Animated.View
        style={[
          styles.playerBall,
          styles.leftBall,
          { transform: [{ translateX: leftBallX }] },
        ]}
      />
      <Animated.View
        style={[
          styles.playerBall,
          styles.rightBall,
          { transform: [{ translateX: rightBallX }] },
        ]}
      />
      <View style={styles.centerLine} />

      <Pressable
        style={({ pressed }) => [
          styles.homeButton,
          { top: insets.top + 8 },
          pressed && styles.homeButtonPressed,
        ]}
        disabled={gameOver}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.homeButtonLabel}>Home</Text>
      </Pressable>

      {gameOver ? (
        <View style={styles.gameOverOverlay} pointerEvents="auto">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Game over</Text>
              <Text style={styles.modalScoreLabel}>Score</Text>
              <Text style={styles.modalScoreValue}>{score}</Text>
              <Pressable
                style={({ pressed }) => [styles.modalPrimaryButton, pressed && styles.modalButtonPressed]}
                onPress={handlePlayAgain}
              >
                <Text style={styles.modalPrimaryButtonLabel}>Play again</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalSecondaryButton, pressed && styles.modalButtonPressed]}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.modalSecondaryButtonLabel}>Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <View
        style={[styles.scoreOverlay, { top: insets.top + 8 + 36 + 8 }]}
        pointerEvents="none"
      >
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: '#f8fafc',
    zIndex: 1,
  },
  scoreOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  scoreBox: {
    minWidth: 44,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  leftTouchZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
  },
  rightTouchZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
  },
  playerBall: {
    position: 'absolute',
    top: '85%',
    width: BALL_SIZE,
    height: BALL_SIZE,
    marginTop: -BALL_SIZE / 2,
    marginLeft: -BALL_SIZE / 2,
    borderRadius: 999,
    backgroundColor: '#22d3ee',
    borderWidth: 2,
    borderColor: '#ecfeff',
    zIndex: 2,
    elevation: 2,
  },
  leftBall: {
    left: '25%',
  },
  rightBall: {
    left: '75%',
  },
  fallingObject: {
    position: 'absolute',
    top: 0,
    width: FALLING_OBJECT_SIZE,
    height: FALLING_OBJECT_SIZE,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    zIndex: 1,
    elevation: 1,
  },
  homeButton: {
    position: 'absolute',
    alignSelf: 'center',
    minWidth: 64,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  homeButtonPressed: {
    opacity: 0.85,
  },
  homeButtonLabel: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalScoreLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalScoreValue: {
    color: '#f8fafc',
    fontSize: 36,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginBottom: 22,
  },
  modalPrimaryButton: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#22d3ee',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryButtonLabel: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondaryButton: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  modalSecondaryButtonLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  modalButtonPressed: {
    opacity: 0.88,
  },
});
