// Capacitor haptics utility — works without @capacitor/haptics installed.
// Dynamic imports with runtime detection so web builds don't crash.

const HAPTICS_MODULE = '@capacitor/haptics';

export async function tapLight() {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import(/* webpackIgnore: true */ HAPTICS_MODULE);
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch {}
}

export async function tapMedium() {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import(/* webpackIgnore: true */ HAPTICS_MODULE);
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  } catch {}
}

export async function tapHeavy() {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import(/* webpackIgnore: true */ HAPTICS_MODULE);
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  } catch {}
}

export async function notifySuccess() {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      const { Haptics, NotificationType } = await import(/* webpackIgnore: true */ HAPTICS_MODULE);
      await Haptics.notification({ type: NotificationType.Success });
    }
  } catch {}
}

export async function notifyError() {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      const { Haptics, NotificationType } = await import(/* webpackIgnore: true */ HAPTICS_MODULE);
      await Haptics.notification({ type: NotificationType.Error });
    }
  } catch {}
}
