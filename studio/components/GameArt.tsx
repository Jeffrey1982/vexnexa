import Image from 'next/image';

export function Phone({ screen, alt, className = '', priority = false }: {screen: 'home' | 'quiz'; alt: string; className?: string; priority?: boolean}) {
  return <div className={`phone ${className}`}>
    <div className="phone-screen"><Image src={`/studio/ipiwow-${screen}.png`} alt={alt} width={1284} height={2778} priority={priority} sizes="(max-width: 640px) 55vw, 370px" className="app-screen-image" /></div>
    <span className="phone-notch" aria-hidden="true" />
  </div>;
}

export function GameArt({ alts, mascotAlt, priority = false }: {alts: [string,string,string]; mascotAlt: string; priority?: boolean}) {
  return <div className="game-art">
    <Image src="/studio/ipiwow-wordmark.svg" alt="IpiWow" width={520} height={114} className="art-logo" priority={priority} />
    <Phone screen="home" alt={alts[0]} className="phone-home" priority={priority} />
    <Phone screen="quiz" alt={alts[2]} className="phone-quiz" priority={priority} />
    <Image src="/studio/ipiwow-mascot.png" alt={mascotAlt} width={1280} height={1280} className="hero-mascot" sizes="(max-width:640px) 45vw, 330px" priority={priority} />
    <span className="spark spark-one" aria-hidden="true">✦</span><span className="spark spark-two" aria-hidden="true">✦</span><span className="spark spark-three" aria-hidden="true">✦</span>
  </div>;
}

export function Hills() {
  return <svg className="hills" viewBox="0 0 1440 210" preserveAspectRatio="none" aria-hidden="true"><path fill="var(--mint-light)" d="M0 30C230 200 390 185 660 82S1110 30 1440 130V210H0Z"/><path fill="var(--mint)" d="M0 160C290 40 530 230 820 120S1160 10 1440 55V210H0Z"/></svg>;
}
