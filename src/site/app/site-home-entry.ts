export type SiteHomeLocationState = {
  homeView?: "hero" | "storefront";
  animateIntro?: boolean;
  runtimeKey?: string;
};

const HOME_ENTRY_RUNTIME_KEY = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function storefrontHomeState(): SiteHomeLocationState {
  return { homeView: "storefront", runtimeKey: HOME_ENTRY_RUNTIME_KEY };
}

export function storefrontAnimatedHomeState(): SiteHomeLocationState {
  return { homeView: "storefront", animateIntro: true, runtimeKey: HOME_ENTRY_RUNTIME_KEY };
}

export function heroHomeState(): SiteHomeLocationState {
  return { homeView: "hero", runtimeKey: HOME_ENTRY_RUNTIME_KEY };
}

export function resolveHomeView(state: unknown): "hero" | "storefront" {
  if (!state || typeof state !== "object") {
    return "hero";
  }
  const homeState = state as SiteHomeLocationState;
  if (homeState.runtimeKey !== HOME_ENTRY_RUNTIME_KEY) {
    return "hero";
  }
  const homeView = homeState.homeView;
  return homeView === "storefront" ? "storefront" : "hero";
}

export function shouldAnimateHomeIntro(state: unknown): boolean {
  if (!state || typeof state !== "object") {
    return false;
  }
  const homeState = state as SiteHomeLocationState;
  return homeState.runtimeKey === HOME_ENTRY_RUNTIME_KEY && homeState.animateIntro === true;
}
