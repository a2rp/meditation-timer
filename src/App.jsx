import { useEffect, useState } from "react";
import styles from "./App.module.css";
import SiteHeader from "./components/siteHeader";
import SiteFooter from "./components/siteFooter";
import BackToTop from "./components/backToTop";
import MeditationTimer from "./components/meditationTimer";

const repository = "https://github.com/a2rp/meditation-timer";
const App = () => {
    const [showBackToTop, setShowBackToTop] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return <div className={styles["app-shell"]} id="top">
        <SiteHeader title="Quiet Hours" mark="Q" navItems={[["Session", "#session"], ["Practice log", "#practice-log"], ["Breathing guide", "#breathing-guide"]]} repoUrl={repository} />
        <main className={styles.pageContent}><MeditationTimer /></main>
        <SiteFooter repoUrl={repository} />
        <BackToTop visible={showBackToTop} />
    </div>;
};
export default App;
