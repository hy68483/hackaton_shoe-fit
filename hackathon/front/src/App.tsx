import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AuthStatusBar, BottomNav } from "./features/shared/layout";

const AccountPage = lazy(() =>
  import("./features/account/AccountPage").then((module) => ({ default: module.AccountPage })),
);
const FootProfilePage = lazy(() =>
  import("./features/account/FootProfilePage").then((module) => ({ default: module.FootProfilePage })),
);
const RecommendationsPage = lazy(() =>
  import("./features/account/RecommendationsPage").then((module) => ({ default: module.RecommendationsPage })),
);
const AdminShell = lazy(() =>
  import("./features/admin/AdminShell").then((module) => ({ default: module.AdminShell })),
);
const IdentityVerificationPage = lazy(() =>
  import("./features/auth/pages").then((module) => ({ default: module.IdentityVerificationPage })),
);
const LoginPage = lazy(() =>
  import("./features/auth/pages").then((module) => ({ default: module.LoginPage })),
);
const SignupCompletePage = lazy(() =>
  import("./features/auth/pages").then((module) => ({ default: module.SignupCompletePage })),
);
const SignupIdPage = lazy(() =>
  import("./features/auth/pages").then((module) => ({ default: module.SignupIdPage })),
);
const SignupPasswordPage = lazy(() =>
  import("./features/auth/pages").then((module) => ({ default: module.SignupPasswordPage })),
);
const StartPage = lazy(() =>
  import("./features/auth/pages").then((module) => ({ default: module.StartPage })),
);
const MeasurePage = lazy(() =>
  import("./features/measurement/MeasurePage").then((module) => ({ default: module.MeasurePage })),
);
const CartPage = lazy(() =>
  import("./features/shop/CartPage").then((module) => ({ default: module.CartPage })),
);
const ExplorePage = lazy(() =>
  import("./features/shop/ExplorePage").then((module) => ({ default: module.ExplorePage })),
);
const HomePage = lazy(() =>
  import("./features/shop/HomePage").then((module) => ({ default: module.HomePage })),
);
const ProductDetailPage = lazy(() =>
  import("./features/shop/ProductDetailPage").then((module) => ({ default: module.ProductDetailPage })),
);
const ProductListPage = lazy(() =>
  import("./features/shop/ProductListPage").then((module) => ({ default: module.ProductListPage })),
);
const SearchPage = lazy(() =>
  import("./features/shop/SearchPage").then((module) => ({ default: module.SearchPage })),
);
const WishlistPage = lazy(() =>
  import("./features/shop/WishlistPage").then((module) => ({ default: module.WishlistPage })),
);

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<IdentityVerificationPage />} />
        <Route path="/signup/id" element={<SignupIdPage />} />
        <Route path="/signup/password" element={<SignupPasswordPage />} />
        <Route path="/signup/complete" element={<SignupCompletePage />} />
        <Route path="/signup/options" element={<IdentityVerificationPage />} />
        <Route path="/admin/*" element={<AdminShell />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </Suspense>
  );
}

function RouteFallback() {
  return <div className="min-h-dvh bg-[#FBFAFF]" aria-busy="true" />;
}

export function AppShell() {
  const location = useLocation();
  const hideBottomNav =
    location.pathname.startsWith("/measure") ||
    /^\/products\/[^/]+$/.test(location.pathname) ||
    location.pathname === "/account/foot-profile" ||
    location.pathname === "/cart";

  return (
    <main className="min-h-screen bg-[#ebe9f7] text-[#191821]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FBFAFF] shadow-xl shadow-[#4640DE]/10">
        <AuthStatusBar />
        <div className={hideBottomNav ? "flex-1" : "flex-1 pb-[76px]"}>
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/measure" element={<MeasurePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route
              path="/products/:productId"
              element={<ProductDetailPage />}
            />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/foot-profile" element={<FootProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
          </Routes>
        </div>

        {!hideBottomNav && <BottomNav />}
      </div>
    </main>
  );
}

export default App;
