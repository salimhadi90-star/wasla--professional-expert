// @ts-nocheck 
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  FileText, 
  Upload, 
  Send, 
  User, 
  Bot, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  Briefcase,
  Target,
  MapPin,
  Loader2
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { chatWithGemini, analyzeResume } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'chat' | 'analyzer';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'model', text: 'أهلاً بك يا بطل! أنا مستشارك المهني من شبكة وصلة. كيف أقدر أساعدك اليوم في رحلتك المهنية؟ 💼✨' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Analyzer State
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const response = await chatWithGemini(userMsg, history);
      setChatMessages(prev => [...prev, { role: 'model', text: response || 'عذراً، حدث خطأ ما. حاول مرة أخرى.' }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'حدث خطأ في الاتصال. تأكد من إعدادات المفتاح البرمجي.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !jobDescription.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const base64 = await fileToBase64(selectedFile);
      const result = await analyzeResume(base64, selectedFile.type, jobDescription);
      setAnalysisResult(result || 'لم أتمكن من تحليل السيرة الذاتية.');
    } catch (error) {
      console.error(error);
      setAnalysisResult('حدث خطأ أثناء التحليل. يرجى المحاولة لاحقاً.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">شبكة وصلة</h1>
              <p className="text-xs text-gray-500 font-medium">الخبير المهني الأول في اليمن</p>
            </div>
          </div>
          
          <nav className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                activeTab === 'chat' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <MessageSquare size={16} />
              <span>الاستشارة</span>
            </button>
            <button 
              onClick={() => setActiveTab('analyzer')}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                activeTab === 'analyzer' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <FileText size={16} />
              <span>محلل السير</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                    )}>
                      <div className="flex items-center gap-2 mb-1 opacity-70">
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {msg.role === 'user' ? 'أنت' : 'وصلة AI'}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-emerald-900">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <Loader2 className="animate-spin text-emerald-600" size={18} />
                      <span className="text-sm text-gray-500 font-medium">جاري التفكير...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-top border-gray-100 bg-gray-50/50">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="اسألني عن أي شيء يخص مستقبلك المهني..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isChatLoading || !inputMessage.trim()}
                    className="absolute left-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analyzer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Inputs */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Upload size={16} className="text-emerald-600" />
                      تحميل السيرة الذاتية (PDF أو صورة)
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                        selectedFile ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50"
                      )}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".pdf,image/*"
                      />
                      {selectedFile ? (
                        <>
                          <CheckCircle2 className="text-emerald-600" size={32} />
                          <div className="text-center">
                            <p className="text-sm font-bold text-emerald-900 truncate max-w-[200px]">{selectedFile.name}</p>
                            <p className="text-xs text-emerald-600">تم اختيار الملف بنجاح</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <Upload size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-700">اضغط هنا للتحميل</p>
                            <p className="text-xs text-gray-400">PDF, PNG, JPG (Max 5MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Briefcase size={16} className="text-emerald-600" />
                      وصف الوظيفة (Job Description)
                    </label>
                    <textarea 
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="انسخ نص الوظيفة هنا (المتطلبات، المسؤوليات...)"
                      className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    disabled={!selectedFile || !jobDescription.trim() || isAnalyzing}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        جاري التحليل العميق...
                      </>
                    ) : (
                      <>
                        <Target size={20} />
                        ابدأ التحليل الآن
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <AlertCircle size={18} />
                      نصيحة وصلة
                    </h3>
                    <p className="text-sm text-emerald-100 leading-relaxed">
                      المنظمات الدولية تهتم جداً بالكلمات المفتاحية (Keywords). تأكد من أن سيرتك تحتوي على المصطلحات الموجودة في وصف الوظيفة.
                    </p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Sparkles size={120} />
                  </div>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                {analysisResult ? (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose prose-emerald max-w-none"
                  >
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold m-0">نتائج التحليل المهني</h2>
                        <p className="text-sm text-gray-500 m-0">بناءً على معايير شبكة وصلة للتوظيف</p>
                      </div>
                    </div>
                    <div className="markdown-body">
                      <Markdown>{analysisResult}</Markdown>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600 mb-2">في انتظار بياناتك</h3>
                    <p className="text-sm max-w-xs">قم برفع سيرتك الذاتية وإضافة وصف الوظيفة لنقوم بتحليل الفجوات وتقديم النصائح المهنية لك.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-400 font-medium">
          تم التطوير بواسطة <span className="text-emerald-600 font-bold">شبكة وصلة</span> - جميع الحقوق محفوظة {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

