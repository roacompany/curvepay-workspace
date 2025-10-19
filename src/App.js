import React, { useState, useEffect } from 'react';
import { Menu, Plus, Search, MessageSquare, Folder, FileText, Kanban, CheckSquare, Lightbulb, TrendingUp, Users, Settings, ChevronRight, ChevronDown, Send, Sparkles, X, Edit2, Trash2, Save, Eye, Code, Image, List, ListOrdered, Bold, Italic, Link2, Type, AlignLeft, Table, CheckCircle, LogOut, UserCircle, Shield, Lock } from 'lucide-react';

// Firebase 시뮬레이션
const mockFirebase = {
  auth: {
    currentUser: null,
    signIn: async (email, password) => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        mockFirebase.auth.currentUser = { uid: user.id, email: user.email, role: user.role, displayName: user.name };
        localStorage.setItem('currentUser', JSON.stringify(mockFirebase.auth.currentUser));
        return mockFirebase.auth.currentUser;
      }
      throw new Error('로그인 실패');
    },
    signUp: async (email, password, name, role) => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const newUser = { id: Date.now().toString(), email, password, name, role };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      return newUser;
    },
    signOut: async () => {
      mockFirebase.auth.currentUser = null;
      localStorage.removeItem('currentUser');
    }
  },
  firestore: {
    collection: (name) => ({
      get: async () => {
        const data = JSON.parse(localStorage.getItem(name) || '[]');
        return data;
      },
      add: async (doc) => {
        const data = JSON.parse(localStorage.getItem(name) || '[]');
        const newDoc = { ...doc, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        data.push(newDoc);
        localStorage.setItem(name, JSON.stringify(data));
        return newDoc;
      },
      update: async (id, updates) => {
        const data = JSON.parse(localStorage.getItem(name) || '[]');
        const index = data.findIndex(d => d.id === id);
        if (index !== -1) {
          data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
          localStorage.setItem(name, JSON.stringify(data));
        }
      },
      delete: async (id) => {
        const data = JSON.parse(localStorage.getItem(name) || '[]');
        const filtered = data.filter(d => d.id !== id);
        localStorage.setItem(name, JSON.stringify(filtered));
      }
    })
  }
};

const CurvePayWorkspace = () => {
  const [user, setUser] = useState(null);
  const [loginMode, setLoginMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '', role: 'employee' });
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [selectedPage, setSelectedPage] = useState(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const [pages, setPages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [editingPage, setEditingPage] = useState(null);
  const [editorMode, setEditorMode] = useState('edit');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      mockFirebase.auth.currentUser = parsedUser;
      loadData();
    } else {
      const demoUsers = [
        { id: '1', email: 'admin@curvepay.kr', password: 'admin123', name: '김대표', role: 'admin' },
        { id: '2', email: 'employee@curvepay.kr', password: 'emp123', name: '박직원', role: 'employee' }
      ];
      localStorage.setItem('users', JSON.stringify(demoUsers));
    }
  }, []);

  const loadData = async () => {
    const loadedPages = await mockFirebase.firestore.collection('pages').get();
    const loadedTasks = await mockFirebase.firestore.collection('tasks').get();
    
    if (loadedPages.length === 0) {
      const initialPages = [
        {
          title: '🎯 프로젝트 개요',
          content: '# CurvePay Korea\n\n## 비전\n한국 시장을 위한 혁신적인 카드 통합 결제 서비스\n\n## 목표\n- Phase 1: 간편 카드 관리 앱 (6-12개월)\n- Phase 2: 선불전자지급수단 (12-24개월)\n- Phase 3: Full Service (24개월+)\n\n## 핵심 가치\n1. **단순함**: 복잡한 금융을 쉽게\n2. **신뢰**: 안전한 금융 인프라\n3. **혁신**: 기술로 만드는 변화',
          category: 'strategy',
          author: user?.displayName || 'System',
          authorId: user?.uid || 'system'
        },
        {
          title: '📋 규제 체크리스트',
          content: '# 한국 금융 규제 체크리스트\n\n## Phase 1 필수 라이선스\n- [ ] 전자금융업 등록\n- [ ] 정보보호관리체계(ISMS) 인증\n- [ ] 개인정보보호 인증\n\n## Phase 2 추가 라이선스\n- [ ] 선불전자지급수단발행업\n- [ ] PG사 등록\n- [ ] ISO 27001\n\n## 준비 서류\n### 전자금융업 등록\n1. 사업계획서\n2. 자본금 증명 (10억원)\n3. 정보보호 시스템 구축 계획\n4. 임원진 이력서\n\n## 타임라인\n```\n Month 1-2: 법률 자문 및 서류 준비\n Month 3-4: ISMS 인증 준비\n Month 5-6: 전자금융업 등록 신청\n```',
          category: 'legal',
          author: user?.displayName || 'System',
          authorId: user?.uid || 'system'
        }
      ];
      
      for (const page of initialPages) {
        await mockFirebase.firestore.collection('pages').add(page);
      }
      
      const initialTasks = [
        { title: '전자금융업 등록 요건 조사', status: 'in-progress', assignee: '김대표', priority: 'high' },
        { title: 'MVP 기능 명세서 작성', status: 'in-progress', assignee: '박직원', priority: 'high' },
        { title: '개발자 채용 JD 작성', status: 'todo', assignee: '김대표', priority: 'medium' },
        { title: '투자 피칭 덱 준비', status: 'todo', assignee: '김대표', priority: 'high' }
      ];
      
      for (const task of initialTasks) {
        await mockFirebase.firestore.collection('tasks').add(task);
      }
      
      loadData();
    } else {
      setPages(loadedPages);
      setTasks(loadedTasks);
    }
  };

  const handleLogin = async () => {
    try {
      const loggedInUser = await mockFirebase.auth.signIn(loginForm.email, loginForm.password);
      setUser(loggedInUser);
      await loadData();
    } catch (error) {
      alert('로그인 실패: 이메일과 비밀번호를 확인하세요.');
    }
  };

  const handleSignup = async () => {
    try {
      await mockFirebase.auth.signUp(loginForm.email, loginForm.password, loginForm.name, loginForm.role);
      alert('회원가입 성공! 로그인해주세요.');
      setLoginMode('login');
      setLoginForm({ email: '', password: '', name: '', role: 'employee' });
    } catch (error) {
      alert('회원가입 실패');
    }
  };

  const handleLogout = async () => {
    await mockFirebase.auth.signOut();
    setUser(null);
    setPages([]);
    setTasks([]);
  };

  const canEdit = () => user?.role === 'admin';

  const categoryColors = {
    strategy: 'bg-blue-100 text-blue-800',
    legal: 'bg-red-100 text-red-800',
    tech: 'bg-green-100 text-green-800',
    design: 'bg-purple-100 text-purple-800',
    research: 'bg-yellow-100 text-yellow-800'
  };

  const handleAskAI = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiThinking(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [...chatMessages, userMessage],
          system: `당신은 CurvePay Korea의 전문 비즈니스 어드바이저입니다. 현재 사용자: ${user?.displayName} (${user?.role}). 금융 규제, 사업 전략, 기술 스택에 대해 구체적이고 실용적인 조언을 제공합니다.`
        })
      });

      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.content[0].text };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '일시적 오류가 발생했습니다.' }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const addNewPage = async () => {
    if (!newPageTitle.trim() || !canEdit()) return;
    
    const newPage = {
      title: newPageTitle,
      content: `# ${newPageTitle}\n\n내용을 작성하세요...`,
      category: 'strategy',
      author: user.displayName,
      authorId: user.uid
    };
    
    const added = await mockFirebase.firestore.collection('pages').add(newPage);
    setPages(prev => [...prev, added]);
    setNewPageTitle('');
    setSelectedPage(added);
  };

  const deletePage = async (pageId) => {
    if (!canEdit()) return;
    await mockFirebase.firestore.collection('pages').delete(pageId);
    setPages(prev => prev.filter(p => p.id !== pageId));
    if (selectedPage?.id === pageId) setSelectedPage(null);
  };

  const updatePageContent = async (pageId, newContent) => {
    await mockFirebase.firestore.collection('pages').update(pageId, { content: newContent });
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, content: newContent } : p));
  };

  const moveTask = async (taskId, newStatus) => {
    await mockFirebase.firestore.collection('tasks').update(taskId, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const insertMarkdown = (before, after = '') => {
    if (!editingPage) return;
    const textarea = document.getElementById('markdown-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingPage.content;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    setEditingPage({ ...editingPage, content: newText });
  };

  const renderMarkdown = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLines = [];

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
              <code>{codeLines.join('\n')}</code>
            </pre>
          );
          codeLines = [];
        }
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-4xl font-bold mb-4 mt-8 text-gray-900">{line.substring(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-3xl font-semibold mb-3 mt-6 text-gray-800">{line.substring(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-2xl font-semibold mb-2 mt-5 text-gray-800">{line.substring(4)}</h3>);
      } else if (line.match(/^- \[ \] /)) {
        elements.push(
          <div key={i} className="flex items-center gap-2 ml-6 mb-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>{line.substring(6)}</span>
          </div>
        );
      } else if (line.match(/^- \[x\] /)) {
        elements.push(
          <div key={i} className="flex items-center gap-2 ml-6 mb-2">
            <input type="checkbox" checked className="w-4 h-4" />
            <span className="line-through text-gray-500">{line.substring(6)}</span>
          </div>
        );
      } else if (line.startsWith('- ')) {
        elements.push(<li key={i} className="ml-6 mb-1 list-disc">{line.substring(2)}</li>);
      } else if (line.match(/^\d+\. /)) {
        elements.push(<li key={i} className="ml-6 mb-1 list-decimal">{line.replace(/^\d+\. /, '')}</li>);
      } else if (line.startsWith('> ')) {
        elements.push(<blockquote key={i} className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-2">{line.substring(2)}</blockquote>);
      } else if (line === '---') {
        elements.push(<hr key={i} className="my-6 border-gray-300" />);
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        let processedLine = line;
        processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        processedLine = processedLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
        processedLine = processedLine.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>');
        elements.push(<p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />);
      }
    });

    return elements;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">CurvePay Korea</h1>
            <p className="text-gray-600">프로젝트 워크스페이스</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setLoginMode('login')}
              className={`flex-1 py-2 rounded-lg font-medium ${
                loginMode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setLoginMode('signup')}
              className={`flex-1 py-2 rounded-lg font-medium ${
                loginMode === 'signup' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              회원가입
            </button>
          </div>

          <div className="space-y-4">
            {loginMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && (loginMode === 'login' ? handleLogin() : handleSignup())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {loginMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                <select
                  value={loginForm.role}
                  onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="employee">직원</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            )}

            <button
              onClick={loginMode === 'login' ? handleLogin : handleSignup}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {loginMode === 'login' ? '로그인' : '회원가입'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 font-medium mb-2">데모 계정</p>
            <p className="text-xs text-gray-600">관리자: admin@curvepay.kr / admin123</p>
            <p className="text-xs text-gray-600">직원: employee@curvepay.kr / emp123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">CurvePay Korea</h1>
          <div className="flex items-center gap-2 mt-2">
            <UserCircle className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600">{user.displayName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
              {user.role === 'admin' ? '관리자' : '직원'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {canEdit() && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNewPage()}
                placeholder="새 페이지 제목"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={addNewPage} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          <nav className="space-y-1">
            <button
              onClick={() => setActiveView('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg ${
                activeView === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Folder className="w-4 h-4" />
              대시보드
            </button>

            <button
              onClick={() => setActiveView('kanban')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg ${
                activeView === 'kanban' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Kanban className="w-4 h-4" />
              칸반 보드
            </button>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase mb-2">페이지</p>
              {pages.map(page => (
                <div key={page.id} className="group">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPage(page);
                        setActiveView('page');
                      }}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                        selectedPage?.id === page.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{page.title}</span>
                    </button>
                    {canEdit() && (
                      <button
                        onClick={() => deletePage(page.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeView === 'overview' && '프로젝트 대시보드'}
              {activeView === 'kanban' && '작업 칸반 보드'}
              {activeView === 'page' && selectedPage?.title}
            </h2>
          </div>

          <button
            onClick={() => setAiChatOpen(!aiChatOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="w-4 h-4" />
            AI 어시스턴트
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeView === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">총 페이지</span>
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{pages.length}</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">진행 중</span>
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.status === 'in-progress').length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">완료</span>
                    <CheckSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.status === 'done').length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">대기</span>
                    <CheckSquare className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.status === 'todo').length}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">최근 페이지</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pages.slice(0, 4).map(page => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setSelectedPage(page);
                        setActiveView('page');
                      }}
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className={`p-2 rounded-lg ${categoryColors[page.category]}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{page.title}</h4>
                        <p className="text-xs text-gray-500">작성자: {page.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'kanban' && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['todo', 'in-progress', 'done'].map(status => (
                  <div key={status} className="bg-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        {status === 'todo' && '📋 할 일'}
                        {status === 'in-progress' && '⚡ 진행 중'}
                        {status === 'done' && '✅ 완료'}
                      </h3>
                      <span className="text-sm text-gray-600">{tasks.filter(t => t.status === status).length}</span>
                    </div>
                    <div className="space-y-3">
                      {tasks.filter(t => t.status === status).map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                          <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{task.assignee}</span>
                            <div className="flex gap-1">
                              {status !== 'todo' && (
                                <button
                                  onClick={() => moveTask(task.id, status === 'in-progress' ? 'todo' : 'in-progress')}
                                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  ←
                                </button>
                              )}
                              {status !== 'done' && (
                                <button
                                  onClick={() => moveTask(task.id, status === 'todo' ? 'in-progress' : 'done')}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'page' && selectedPage && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200">
                {editingPage?.id === selectedPage.id ? (
                  <div>
                    <div className="border-b border-gray-200 p-3 flex items-center gap-2 flex-wrap">
                      <div className="flex gap-1">
                        <button onClick={() => insertMarkdown('**', '**')} className="p-2 hover:bg-gray-100 rounded" title="Bold">
                          <Bold className="w-4 h-4" />
                        </button>
                        <button onClick={() => insertMarkdown('*', '*')} className="p-2 hover:bg-gray-100 rounded" title="Italic">
                          <Italic className="w-4 h-4" />
                        </button>
                        <button onClick={() => insertMarkdown('`', '`')} className="p-2 hover:bg-gray-100 rounded" title="Code">
                          <Code className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="w-px h-6 bg-gray-300" />
                      
                      <div className="flex gap-1">
                        <button onClick={() => insertMarkdown('# ')} className="p-2 hover:bg-gray-100 rounded text-xs font-semibold">
                          H1
                        </button>
                        <button onClick={() => insertMarkdown('## ')} className="p-2 hover:bg-gray-100 rounded text-xs font-semibold">
                          H2
                        </button>
                        <button onClick={() => insertMarkdown('### ')} className="p-2 hover:bg-gray-100 rounded text-xs font-semibold">
                          H3
                        </button>
                      </div>
                      
                      <div className="w-px h-6 bg-gray-300" />
                      
                      <div className="flex gap-1">
                        <button onClick={() => insertMarkdown('- ')} className="p-2 hover:bg-gray-100 rounded">
                          <List className="w-4 h-4" />
                        </button>
                        <button onClick={() => insertMarkdown('1. ')} className="p-2 hover:bg-gray-100 rounded">
                          <ListOrdered className="w-4 h-4" />
                        </button>
                        <button onClick={() => insertMarkdown('- [ ] ')} className="p-2 hover:bg-gray-100 rounded">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="w-px h-6 bg-gray-300" />
                      
                      <div className="flex gap-1">
                        <button onClick={() => insertMarkdown('[링크](url)')} className="p-2 hover:bg-gray-100 rounded">
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => insertMarkdown('```\n', '\n```')} className="p-2 hover:bg-gray-100 rounded">
                          <Code className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1" />
                      
                      <button
                        onClick={() => setEditorMode(editorMode === 'edit' ? 'preview' : 'edit')}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                      >
                        {editorMode === 'edit' ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        {editorMode === 'edit' ? '미리보기' : '편집'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200">
                      <div className="p-6">
                        <textarea
                          id="markdown-editor"
                          value={editingPage.content}
                          onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                          className="w-full h-[600px] font-mono text-sm focus:outline-none resize-none"
                          placeholder="마크다운으로 작성하세요..."
                        />
                      </div>
                      
                      <div className="p-6 overflow-y-auto h-[600px] prose prose-sm max-w-none">
                        {renderMarkdown(editingPage.content)}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 p-4 flex gap-2">
                      <button
                        onClick={() => {
                          updatePageContent(selectedPage.id, editingPage.content);
                          setSelectedPage({ ...selectedPage, content: editingPage.content });
                          setEditingPage(null);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        저장
                      </button>
                      <button
                        onClick={() => setEditingPage(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[selectedPage.category]}`}>
                          {selectedPage.category.toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-500">작성자: {selectedPage.author}</span>
                      </div>
                      {canEdit() && (
                        <button
                          onClick={() => setEditingPage(selectedPage)}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                          편집
                        </button>
                      )}
                    </div>
                    <div className="prose prose-lg max-w-none">
                      {renderMarkdown(selectedPage.content)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {aiChatOpen && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">AI 어시스턴트</h3>
            </div>
            <button onClick={() => setAiChatOpen(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">안녕하세요, {user.displayName}님! 👋</p>
                <p className="text-xs text-gray-500">CurvePay Korea에 대해<br />무엇이든 물어보세요</p>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAiThinking && handleAskAI()}
                placeholder="메시지 입력..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isAiThinking}
              />
              <button
                onClick={handleAskAI}
                disabled={isAiThinking || !chatInput.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurvePayWorkspace;