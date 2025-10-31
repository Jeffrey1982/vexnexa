"use client";

interface Logo {
  name: string;
  width?: number;
  height?: number;
}

interface LogoStripProps {
  logos: Logo[];
  title?: string;
}

export function LogoStrip({ logos, title = "Trusted by teams who take accessibility seriously" }: LogoStripProps) {
  return (
    <section className="py-16 border-y bg-muted/30" aria-labelledby="logo-strip-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p id="logo-strip-heading" className="text-muted-foreground font-medium">
            {title}
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="bg-muted rounded-lg flex items-center justify-center text-foreground font-medium px-4 py-3 min-w-[100px] opacity-70"
              style={{ width: logo.width || 120, height: logo.height || 40 }}
              role="img"
              aria-label={logo.name}
            >
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
