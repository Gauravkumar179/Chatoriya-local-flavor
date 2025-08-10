import React, { useEffect, useMemo, useRef } from "react"
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  AccessibilityInfo,
} from "react-native"

type SplashScreenProps = {
  duration?: number
  onFinish?: () => void
  title?: string
  tagline?: string
  showLoader?: boolean
  backgroundColor?: string
  primaryColor?: string
  accentColor?: string
}

const { width: SCREEN_W } = Dimensions.get("window")

const SPICE_EMOJIS = ["🌶️", "🧄", "🧅", "🧂", "🫑", "🍋", "🥘", "🫓"]

export const SplashScreen: React.FC<SplashScreenProps> = ({
  duration = 2400,
  onFinish,
  title = "Chatoriya",
  tagline = "Local flavors. Delivered hot.",
  showLoader = true,
  backgroundColor = "#FFF7E9", // warm cream
  primaryColor = "#E85D04", // chili orange
  accentColor = "#2F9E44", // coriander green
}) => {
  // Root fade (used to nicely transition out)
  const rootOpacity = useRef(new Animated.Value(1)).current

  // Logo scale & subtle breathing loop
  const logoScale = useRef(new Animated.Value(0)).current

  // Rotating spice ring
  const ringRotate = useRef(new Animated.Value(0)).current

  // Title letter animations
  const letters = useMemo(() => title.split(""), [title])
  const letterAnims = useRef(letters.map(() => new Animated.Value(0))).current

  // Tagline in
  const taglineAnim = useRef(new Animated.Value(0)).current

  // Loader progress (0..1)
  const loader = useRef(new Animated.Value(0)).current

  // Precompute spice ring layout
  const RING_SIZE = 180
  const RING_RADIUS = (RING_SIZE - 20) / 2 // padding for emoji
  const SPICE_COUNT = 8
  const spices = useMemo(() => {
    const list = []
    for (let i = 0; i < SPICE_COUNT; i++) {
      const angle = (i / SPICE_COUNT) * 2 * Math.PI
      list.push({
        key: `spice-${i}`,
        emoji: SPICE_EMOJIS[i % SPICE_EMOJIS.length],
        x: RING_RADIUS * Math.cos(angle),
        y: RING_RADIUS * Math.sin(angle),
      })
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RING_RADIUS])

  useEffect(() => {
    let reduceMotion = false

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion = !!enabled

      const animations: Animated.CompositeAnimation[] = []

      // Logo entrance
      animations.push(
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          mass: 1,
          stiffness: 160,
          useNativeDriver: true,
        }),
      )

      // Title letters (staggered)
      const letterSprings = letters.map((_, i) =>
        Animated.spring(letterAnims[i], {
          toValue: 1,
          damping: 10,
          mass: 0.8,
          stiffness: 140,
          useNativeDriver: true,
        }),
      )
      animations.push(Animated.stagger(70, letterSprings))

      // Tagline slide/fade
      animations.push(
        Animated.timing(taglineAnim, {
          toValue: 1,
          duration: reduceMotion ? 150 : 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      )

      // Start ring rotation loop
      Animated.loop(
        Animated.timing(ringRotate, {
          toValue: 1,
          duration: reduceMotion ? 2000 : 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start()

      // Subtle breathing on logo
      if (!reduceMotion) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoScale, {
              toValue: 1.03,
              duration: 1000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
              toValue: 1.0,
              duration: 1000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ).start()
      }

      // Start entrance sequence
      Animated.sequence([Animated.parallel(animations)]).start()

      // Loader progress and auto-finish
      Animated.timing(loader, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false, // width animation can't use native driver
      }).start(({ finished }) => {
        if (finished) {
          // Fade out the splash, then notify
          Animated.timing(rootOpacity, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            onFinish?.()
          })
        }
      })
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, letters.join("")])

  const ringRotation = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  // Colors for letters (spice palette)
  const letterColors = useMemo(
    () => [
      "#D00000", // chili red
      "#DC2F02",
      "#E85D04",
      "#F48C06",
      "#FAA307",
      "#80B918", // green
      "#2F9E44",
      "#1E6091", // slate blue accent
      "#9C6644", // masala brown
    ],
    [],
  )

  const BAR_W = Math.min(280, SCREEN_W * 0.7)
  const progressWidth = loader.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_W],
  })

  return (
    <Animated.View
      style={[
        styles.root,
        { backgroundColor, opacity: rootOpacity },
      ]}
      accessibilityLabel="Chatoriya splash screen"
      accessible
    >
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
        backgroundColor={backgroundColor}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          {/* Logo + rotating spice ring */}
          <Animated.View
            style={[
              styles.logoWrap,
              {
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            {/* Ring */}
            <Animated.View
              style={[
                styles.ring,
                {
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderColor: accentColor,
                  transform: [{ rotate: ringRotation }],
                },
              ]}
              accessibilityLabel="Rotating ring of spices"
              accessible
            >
              {spices.map((s, idx) => (
                <View
                  key={s.key}
                  style={[
                    styles.spice,
                    {
                      left: RING_SIZE / 2 + s.x - 12,
                      top: RING_SIZE / 2 + s.y - 12,
                    },
                  ]}
                  accessibilityElementsHidden // decorative
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text style={styles.spiceText}>{s.emoji}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Badge */}
            <View style={[styles.badge, { borderColor: primaryColor }]}>
              <View style={[styles.badgeInner, { backgroundColor: "#FFE8CC" }]} />
              <Text
                style={[
                  styles.monogram,
                  { color: primaryColor, textShadowColor: "rgba(0,0,0,0.08)" },
                ]}
              >
                C
              </Text>
            </View>
          </Animated.View>

          {/* Title */}
          <View style={styles.titleRow} accessibilityRole="header">
            {letters.map((ch, i) => {
              const v = letterAnims[i]
              const translateY = v.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              })
              const scale = v.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })
              const opacity = v
              const color = letterColors[i % letterColors.length]
              return (
                <Animated.Text
                  key={`${ch}-${i}`}
                  style={[
                    styles.titleLetter,
                    {
                      color,
                      opacity,
                      transform: [{ translateY }, { scale }],
                    },
                  ]}
                >
                  {ch}
                </Animated.Text>
              )
            })}
          </View>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              {
                color: "#5C5C5C",
                opacity: taglineAnim,
                transform: [
                  {
                    translateY: taglineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
            accessibilityLabel={`Tagline: ${tagline}`}
          >
            {tagline}
          </Animated.Text>

          {/* Loader */}
          {showLoader && (
            <View style={styles.loaderWrap} accessibilityLabel="Loading progress">
              <View
                style={[
                  styles.loaderTrack,
                  { width: BAR_W, backgroundColor: "rgba(0,0,0,0.08)" },
                ]}
              >
                <Animated.View
                  style={[
                    styles.loaderFill,
                    {
                      width: progressWidth,
                      backgroundColor: primaryColor,
                    },
                  ]}
                />
                {/* Shine overlay */}
                <Animated.View
                  style={[
                    styles.loaderShine,
                    {
                      transform: [
                        {
                          translateX: loader.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-BAR_W, BAR_W],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 24,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 200,
    opacity: 0.25,
  },
  spice: {
    position: "absolute",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  spiceText: {
    fontSize: 18,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  badgeInner: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    opacity: 0.7,
  },
  monogram: {
    fontSize: 64,
    fontWeight: "800",
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  titleLetter: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.05)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  tagline: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.9,
  },
  loaderWrap: {
    marginTop: 10,
  },
  loaderTrack: {
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  loaderFill: {
    height: 8,
    borderRadius: 8,
  },
  loaderShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ translateX: -200 }],
  },
})