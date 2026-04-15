import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-vg-dark flex flex-col items-center justify-center px-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-vg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-vg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-xl bg-vg-accent flex items-center justify-center glow-blue animate-pulse-glow">
            <span className="text-white font-bold text-2xl">VG</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            AI Surveillance <span className="text-vg-accent text-glow">VisionGuard</span>
          </h1>
        </div>

        {/* Arabic description */}
        <p 
          dir="rtl" 
          lang="ar"
          className="text-lg md:text-xl text-vg-text-muted leading-relaxed mb-10 font-medium"
        >
          منصة مراقبة ذكية تجمع بين الرؤية الحاسوبية و الاستعلام الذكي لتوفير مراقبة تنبيهية فورية، ملخصات ذكية، وإدارة سهلة لكل الكاميرات والأحداث.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/dashboard" 
            className="btn-ghost text-lg px-8 py-3 min-w-[220px]"
          >
            استعرض لوحة التحكم
          </Link>
          <Link 
            to="/sign-in" 
            className="btn-primary text-lg px-8 py-3 min-w-[220px] text-center"
          >
            انتقل إلى تسجيل الدخول
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
            title="Real-time Detection"
            description="YOLOv8 powered object detection"
          />
          <FeatureCard 
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="Smart Alerts"
            description="Anomaly detection & instant notifications"
          />
          <FeatureCard 
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            }
            title="LLM Queries"
            description="Natural language event search"
          />
        </div>
      </div>

      {/* Version badge */}
      <div className="absolute bottom-6 text-vg-text-muted text-sm">
        VisionGuard v1.0 — AI-Powered Surveillance
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card p-6 glass hover:glow-blue-sm transition-all duration-300">
      <div className="w-12 h-12 rounded-lg bg-vg-accent/20 flex items-center justify-center text-vg-accent mb-4 mx-auto">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-vg-text-muted text-sm">{description}</p>
    </div>
  );
}
