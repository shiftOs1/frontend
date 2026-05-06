'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, BarChart2, Bell, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Drag-and-drop shift management with conflict detection and recurring shifts.' },
  { icon: Clock, title: 'Time Tracking', desc: 'One-click clock in/out with automatic overtime calculation and break tracking.' },
  { icon: BarChart2, title: 'Analytics', desc: 'Real-time dashboards with hours, attendance rates, and performance insights.' },
  { icon: Bell, title: 'Instant Notifications', desc: 'Live updates via Socket.io — approvals, shift changes, and exchanges instantly.' },
];

const benefits = [
  'Shift exchange requests',
  'Leave management',
  'PDF & CSV exports',
  'Role-based access',
  'Mobile responsive',
  'Real-time updates',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">ShiftOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
              Workforce Management Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Schedule smarter,<br />
              <span className="text-blue-600">work better</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
              ShiftOS helps teams manage schedules, track hours, handle shift exchanges,
              and analyze workforce performance — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Get started free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign in to dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              A complete toolkit for workforce scheduling and time management.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for real teams</h2>
          <p className="text-slate-500 mb-10">Everything your team needs to stay organized and productive.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {benefits.map((b, i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700"
              >
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                {b}
              </motion.div>
            ))}
          </div>
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start for free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-sm font-medium text-slate-700">ShiftOS</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 ShiftOS. Built with Next.js + Node.js</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <Link href="/login" className="hover:text-slate-600">Login</Link>
            <Link href="/signup" className="hover:text-slate-600">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
