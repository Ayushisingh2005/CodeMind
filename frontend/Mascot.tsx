export default function Mascot({ size = 140 }: { size?: number }) {
  return (
    <div
      className="animate-float relative"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Body */}
      <div
        className="absolute inset-0 rounded-[45%_55%_60%_40%/55%_45%_55%_45%]"
        style={{
          background: 'linear-gradient(160deg, #FF9FC1 0%, #FF7AA8 100%)',
          boxShadow: '0 12px 30px -8px rgba(255,122,168,0.55)',
        }}
      />

      {/* Antenna */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-4 w-[3px] rounded-full"
        style={{ height: 18, background: '#FF7AA8' }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full animate-sparkle"
        style={{ top: -20, width: 10, height: 10, background: 'var(--yellow)' }}
      />

      {/* Eyes */}
      <div className="absolute flex gap-3" style={{ top: '38%', left: '28%' }}>
        <div className="animate-blink rounded-full bg-white" style={{ width: 16, height: 20 }}>
          <div className="rounded-full bg-[#2A2140]" style={{ width: 8, height: 8, marginTop: 6, marginLeft: 4 }} />
        </div>
        <div className="animate-blink rounded-full bg-white" style={{ width: 16, height: 20 }}>
          <div className="rounded-full bg-[#2A2140]" style={{ width: 8, height: 8, marginTop: 6, marginLeft: 4 }} />
        </div>
      </div>

      {/* Cheeks */}
      <div className="absolute rounded-full opacity-60" style={{ top: '52%', left: '18%', width: 12, height: 8, background: '#FFC5DA' }} />
      <div className="absolute rounded-full opacity-60" style={{ top: '52%', right: '18%', width: 12, height: 8, background: '#FFC5DA' }} />

      {/* Magnifying glass, held to the side */}
      <div
        className="animate-wiggle absolute"
        style={{ bottom: -10, right: -22, transformOrigin: 'top left' }}
      >
        <div
          className="rounded-full border-4"
          style={{ width: 32, height: 32, borderColor: 'var(--primary)', background: 'rgba(123,97,255,0.15)' }}
        />
        <div
          className="rounded-full"
          style={{
            width: 16,
            height: 4,
            background: 'var(--primary)',
            position: 'absolute',
            bottom: -4,
            right: -8,
            transform: 'rotate(45deg)',
          }}
        />
      </div>
    </div>
  );
}
