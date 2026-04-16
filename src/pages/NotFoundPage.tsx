import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background font-sans">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-surface-900 border border-white/5 shadow-2xl relative">
             <AlertCircle className="w-12 h-12 text-accent" />
             <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-background animate-pulse" />
          </div>
          
          <h1 className="text-8xl font-black text-white mb-4 tracking-tighter">404</h1>
          <h2 className="text-2xl font-bold text-text mb-4">Lost in the dark?</h2>
          <p className="text-surface-400 mb-10 max-w-sm mx-auto leading-relaxed">
            The page you're looking for has moved to a secret workspace or doesn't exist anymore.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 group"
            >
              <Home className="w-5 h-5" />
              Return Home
            </button>
          </div>
        </motion.div>
      </div>

      {/* Background characters */}
      <div className="absolute bottom-10 left-10 text-white/5 text-9xl font-bold select-none pointer-events-none">?</div>
      <div className="absolute top-10 right-10 text-white/5 text-9xl font-bold select-none pointer-events-none">!</div>
    </div>
  );
};

export default NotFoundPage;
