import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  LayoutChangeEvent,
  PanResponder,
  Modal,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Clipboard from '@react-native-clipboard/clipboard'
import Svg, { Defs, Mask, Rect, Circle, LinearGradient, Stop } from 'react-native-svg'

import { RootStackParamList } from './types' // keep your existing types

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

type Coupon = {
  code: string
  discount: number // percent
  validUntilISO: string // ISO string for validity date
  revealed: boolean
}

const COUPON_STORE_KEY = 'order_success_coupon_v1'

// Utility: one month from now
function addOneMonth(date = new Date()): Date {
  const d = new Date(date)
  const month = d.getMonth()
  d.setMonth(month + 1)
  return d
}

// Utility: format date like "11 Aug 2025"
function formatDate(d: Date): string {
  const day = d.getDate()
  const month = d.toLocaleString('default', { month: 'short' })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// Utility: 3–10 inclusive
function randomDiscount(): number {
  return Math.floor(Math.random() * 8) + 3
}

// Utility: simple UID coupon like "SC-8JK3-1QZ7-29"
function generateCouponCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = (len: number) =>
    Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  return `SC-${rand(4)}-${rand(4)}-${Math.floor(Date.now() / 1000)
    .toString()
    .slice(-2)}`
}

type ScratchCardProps = {
  width: number
  height: number
  brushSize?: number
  threshold?: number // 0..1 fraction scratched required to reveal
  borderRadius?: number
  onReveal: () => void
  revealed?: boolean
  children: React.ReactNode // content to reveal
}

/**
 * ScratchCard: scratch-off overlay using react-native-svg + PanResponder.
 * - Gradient "foil" overlay for premium look.
 * - Grid-based coverage estimate; triggers onReveal when threshold reached.
 */
const ScratchCard: React.FC<ScratchCardProps> = ({
  width,
  height,
  brushSize = 28,
  threshold = 0.5,
  borderRadius = 16,
  onReveal,
  revealed = false,
  children,
}) => {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])
  const revealedRef = useRef(revealed)
  const cellSetRef = useRef<Set<string>>(new Set())
  const totalCellsRef = useRef(0)

  useEffect(() => {
    revealedRef.current = revealed
  }, [revealed])

  const grid = useMemo(() => {
    const cols = Math.max(1, Math.floor(width / brushSize))
    const rows = Math.max(1, Math.floor(height / brushSize))
    totalCellsRef.current = cols * rows
    return { cols, rows }
  }, [width, height, brushSize])

  const addPoint = useCallback(
    (x: number, y: number) => {
      const cx = Math.max(0, Math.min(x, width))
      const cy = Math.max(0, Math.min(y, height))

      setPoints((prev) => {
        const next = prev.length > 1500 ? prev.slice(-1200) : prev
        return [...next, { x: cx, y: cy }]
      })

      const col = Math.floor((cx / width) * grid.cols)
      const row = Math.floor((cy / height) * grid.rows)
      const key = `${col}:${row}`
      if (!cellSetRef.current.has(key)) {
        cellSetRef.current.add(key)
        const covered = cellSetRef.current.size / Math.max(1, totalCellsRef.current)
        if (covered >= threshold && !revealedRef.current) {
          revealedRef.current = true
          onReveal()
        }
      }
    },
    [grid.cols, grid.rows, height, onReveal, threshold, width]
  )

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !revealedRef.current,
      onMoveShouldSetPanResponder: () => !revealedRef.current,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        addPoint(locationX, locationY)
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        addPoint(locationX, locationY)
      },
    })
  ).current

  return (
    <View style={{ width, height }}>
      <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}>{children}</View>

      {!revealed && (
        <View
          style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}
          pointerEvents="auto"
          {...panResponder.panHandlers}
        >
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="foilGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#bfc7d5" />
                <Stop offset="50%" stopColor="#e6ebf3" />
                <Stop offset="100%" stopColor="#b0bacb" />
              </LinearGradient>

              <Mask id="scratchMask">
                {/* white = visible overlay; black = cutout (reveals prize) */}
                <Rect x="0" y="0" width={width} height={height} fill="white" />
                {points.map((p, idx) => (
                  <Circle key={idx} cx={p.x} cy={p.y} r={brushSize} fill="black" />
                ))}
              </Mask>
            </Defs>

            {/* Foil overlay */}
            <Rect
              x="0"
              y="0"
              width={width}
              height={height}
              rx={borderRadius}
              ry={borderRadius}
              fill="url(#foilGradient)"
              mask="url(#scratchMask)"
            />
            {/* Subtle top glare */}
            <Rect
              x="0"
              y="0"
              width={width}
              height={Math.max(16, height * 0.18)}
              fill="rgba(255,255,255,0.25)"
              mask="url(#scratchMask)"
            />
          </Svg>

          {/* Helpful hint overlay */}
          <View style={styles.hintRow}>
            <Text style={styles.hintPill}>{'👆 Scratch here'}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const { width: SCREEN_W } = Dimensions.get('window')

const OrderSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>()

  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [loadingCoupon, setLoadingCoupon] = useState(true)

  const [showScratchModal, setShowScratchModal] = useState(false)
  const scaleAnim = useRef(new Animated.Value(0.85)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Load or generate a coupon
  useEffect(() => {
    const loadOrCreate = async () => {
      try {
        const raw = await AsyncStorage.getItem(COUPON_STORE_KEY)
        if (raw) {
          const saved: Coupon = JSON.parse(raw)
          setCoupon(saved)
          setLoadingCoupon(false)
          // Auto-open popup for users who haven't revealed yet
          setTimeout(() => setShowScratchModal(true), 450)
          return
        }
        const discount = randomDiscount()
        const code = generateCouponCode()
        const validUntil = addOneMonth(new Date()).toISOString()
        const fresh: Coupon = { code, discount, validUntilISO: validUntil, revealed: false }
        await AsyncStorage.setItem(COUPON_STORE_KEY, JSON.stringify(fresh))
        setCoupon(fresh)
      } catch (e) {
        const discount = randomDiscount()
        const code = generateCouponCode()
        const validUntil = addOneMonth(new Date()).toISOString()
        setCoupon({ code, discount, validUntilISO: validUntil, revealed: false })
      } finally {
        setLoadingCoupon(false)
        // Show popup after short delay
        setTimeout(() => setShowScratchModal(true), 450)
      }
    }
    loadOrCreate()
  }, [])

  useEffect(() => {
    if (showScratchModal) {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.85)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [showScratchModal, fadeAnim, scaleAnim])

  const onScratchReveal = useCallback(async () => {
    if (!coupon) return
    const updated = { ...coupon, revealed: true }
    setCoupon(updated)
    try {
      await AsyncStorage.setItem(COUPON_STORE_KEY, JSON.stringify(updated))
    } catch {}
  }, [coupon])

  const handleCopy = useCallback(() => {
    if (!coupon) return
    Clipboard.setString(coupon.code)
  }, [coupon])

  const CARD_WIDTH = Math.min(SCREEN_W - 48, 380)
  const CARD_HEIGHT = 180

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://static.vecteezy.com/system/resources/thumbnails/020/564/998/small_2x/confirm-order-on-transparent-background-free-png.png',
        }}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>{'🎉 Order Placed!'}</Text>
      <Text style={styles.message}>
        {"Your order has been successfully placed. We'll notify you once it's shipped."}
      </Text>

      {/* Open popup again if dismissed */}
      <TouchableOpacity style={[styles.smallButton, { marginBottom: 8 }]} onPress={() => setShowScratchModal(true)}>
        <Text style={styles.smallButtonText}>{coupon?.revealed ? 'View your coupon' : 'Reveal your reward'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('BottomTabs')}>
        <Text style={styles.buttonText}>{'Back to Home'}</Text>
      </TouchableOpacity>

      {/* Scratch Card Popup */}
      <Modal
        transparent
        visible={!loadingCoupon && showScratchModal}
        onRequestClose={() => setShowScratchModal(false)}
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        <View style={styles.modalCenter}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{'Lucky Scratch'}</Text>
              <TouchableOpacity onPress={() => setShowScratchModal(false)} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <Text style={styles.closeX}>{'✕'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{'Scratch to reveal your exclusive discount'}</Text>

            <View style={styles.couponShell}>
              {/* Perforated edges */}
              <View style={styles.perfDotLeft} />
              <View style={styles.perfDotRight} />

              {/* Scratch area or revealed coupon */}
              {!loadingCoupon && coupon && (
                <View style={{ padding: 10 }}>
                  <View style={styles.scratchContainer}>
                    <View style={styles.scratchInner}>
                      <ScratchCard
                        width={CARD_WIDTH - 20}
                        height={CARD_HEIGHT}
                        brushSize={30}
                        threshold={0.5}
                        borderRadius={18}
                        onReveal={onScratchReveal}
                        revealed={coupon.revealed}
                      >
                        <View style={styles.revealContent}>
                          <View style={{ alignItems: 'center', gap: 6 }}>
                            <Text style={styles.winText}>{'You won'}</Text>
                            <Text style={styles.discountText}>{`${coupon.discount}% OFF`}</Text>
                          </View>

                          <View style={{ alignItems: 'center', gap: 8 }}>
                            <Text style={styles.codeLabel}>{'Coupon Code'}</Text>
                            <View style={styles.codeRow}>
                              <Text style={styles.codeText}>{coupon.code}</Text>
                              <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                                <Text style={styles.copyText}>{'Copy'}</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.validityText}>
                              {`Valid until ${formatDate(new Date(coupon.validUntilISO))}`}
                            </Text>
                          </View>
                        </View>
                      </ScratchCard>
                    </View>
                  </View>

                  {!coupon.revealed ? (
                    <Text style={styles.helperText}>
                      {'Scratch at least 50% of the foil to reveal your reward'}
                    </Text>
                  ) : (
                    <Text style={styles.redeemText}>
                      {'Use this code at checkout to apply your discount'}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.secondaryBtn]}
                onPress={() => setShowScratchModal(false)}
              >
                <Text style={[styles.actionBtnText, styles.secondaryBtnText]}>
                  {coupon?.revealed ? 'Close' : 'Reveal later'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.primaryBtn]}
                onPress={() => {
                  if (coupon) Clipboard.setString(coupon.code)
                  setShowScratchModal(false)
                }}
              >
                <Text style={styles.actionBtnText}>{coupon?.revealed ? 'Copy & close' : 'Start scratching'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

export default OrderSuccessScreen

const styles = StyleSheet.create({
  // Base screen
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2e86de',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#2e86de',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeX: {
    fontSize: 20,
    color: '#6b7280',
  },
  modalSubtitle: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 14,
    color: '#6b7280',
  },

  // Coupon shell (dashed border & perforations)
  couponShell: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 16,
    position: 'relative',
    backgroundColor: '#f9fafb',
  },
  perfDotLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    position: 'absolute',
    left: -8,
    top: '50%',
    marginTop: -8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  perfDotRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // Scratch area
  scratchContainer: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  scratchInner: {
    backgroundColor: '#0f172a', // base for contrast
    borderRadius: 18,
  },

  // Revealed content
  revealContent: {
    flex: 1,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220',
    gap: 12,
  },
  winText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  discountText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#f59e0b', // amber/gold
    letterSpacing: 0.5,
  },
  codeLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  codeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  copyButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  copyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  validityText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  redeemText: {
    marginTop: 8,
    fontSize: 12,
    color: '#10b981',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Hint pill on overlay
  hintRow: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  hintPill: {
    backgroundColor: 'rgba(17,24,39,0.8)',
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },

  // Modal actions
  modalActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2e86de',
  },
  secondaryBtn: {
    backgroundColor: '#e5e7eb',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtnText: {
    color: '#111827',
  },
})