import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, Plus, Folder, FileText, Kanban, CheckSquare, Send, Sparkles, X, Edit2, Trash2, Save, Eye, Code, List, ListOrdered, Bold, Italic, Link2, CheckCircle, LogOut, UserCircle, Quote, Minus, Search, Filter, Calendar, Tag, Users, Clock, AlertCircle } from 'lucide-react';

// Firebase 시뮬레이션
const mockFirebase = {
  auth: {
    currentUser: null,
    signIn: async (email, password) => {
      const users = JSON.parse(localStorage.getItem('curvepay_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        mockFirebase.auth.currentUser = { uid: user.id, email: user.email, role: user.role, displayName: user.name };
        localStorage.setItem('curvepay_currentUser', JSON.stringify(mockFirebase.auth.currentUser));
        return mockFirebase.auth.currentUser;
      }
      throw new Error('로그인 실패');
    },
    signUp: async (email, password, name, role) => {
      const users = JSON.parse(localStorage.getItem('curvepay_users') || '[]');
      if (users.find(u => u.email === email)) {
        throw new Error('이미 존재하는 이메일입니다');
      }
      const newUser = { id: Date.now().toString(), email, password, name, role };
      users.push(newUser);
      localStorage.setItem('curvepay_users', JSON.stringify(users));
      return newUser;
    },
    signOut: async () => {
      mockFirebase.auth.currentUser = null;
      localStorage.removeItem('curvepay_currentUser');
    }
  },
  firestore: {
    collection: (name) => ({
      get: async () => {
        const data = JSON.parse(localStorage.getItem(`curvepay_${name}`) || '[]');
        return data;
      },
      add: async (doc) => {
        const data = JSON.parse(localStorage.getItem(`curvepay_${name}`) || '[]');
        const newDoc = { 
          ...doc, 
          id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString() 
        };
        data.push(newDoc);
        localStorage.setItem(`curvepay_${name}`, JSON.stringify(data));
        return newDoc;
      },
      update: async (id, updates) => {
        const data = JSON.parse(localStorage.getItem(`curvepay_${name}`) || '[]');
        const index = data.findIndex(d => d.id === id);
        if (index !== -1) {
          data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
          localStorage.setItem(`curvepay_${name}`, JSON.stringify(data));
          return data[index];
        }
        return null;
      },
      delete: async (id) => {
        const data = JSON.parse(localStorage.getItem(`curvepay_${name}`) || '[]');
        const filtered = data.filter(d => d.id !== id);
        localStorage.setItem(`curvepay_${name}`, JSON.stringify(filtered));
        return true;
      }
    })
  }
};

const CurvePayWorkspace = () => {
  const [user, setUser] = useState(null);
  const [loginMode, setLoginMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '', role: 'employee' });
  const [loginError, setLoginError] = useState('');
  
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
  const [newTaskTitles, setNewTaskTitles] = useState({ todo: '', 'in-progress': '', done: '' });
  const [editingPage, setEditingPage] = useState(null);
  const [editorMode, setEditorMode] = useState('edit');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  
  // 검색 및 필터
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  
  const textareaRef = useRef(null);

  const initializeDemoData = useCallback(() => {
    const demoUsers = [
      { id: '1', email: 'admin@curvepay.kr', password: 'admin123', name: '김대표', role: 'admin' },
      { id: '2', email: 'employee@curvepay.kr', password: 'emp123', name: '박직원', role: 'employee' }
    ];
    localStorage.setItem('curvepay_users', JSON.stringify(demoUsers));
  }, []);

  const loadData = useCallback(async () => {
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
          content: '# 한국 금융 규제 체크리스트\n\n## Phase 1 필수 라이선스\n- [ ] 전자금융업 등록\n- [ ] 정보보호관리체계(ISMS) 인증\n- [ ] 개인정보보호 인증\n\n## Phase 2 추가 라이선스\n- [ ] 선불전자지급수단발행업\n- [ ] PG사 등록\n- [ ] ISO 27001\n\n## 준비 서류\n### 전자금융업 등록\n1. 사업계획서\n2. 자본금 증명 (10억원)\n3. 정보보호 시스템 구축 계획\n4. 임원진 이력서',
          category: 'legal',
          author: user?.displayName || 'System',
          authorId: user?.uid || 'system'
        },
        {
          title: '💻 기술 스택',
          content: '# 기술 스택 선정\n\n## Frontend\n- **React Native**: iOS/Android 동시 개발\n- **TypeScript**: 타입 안정성\n- **Tailwind CSS**: 빠른 UI 개발\n\n## Backend\n- **Node.js + Express**: API 서버\n- **PostgreSQL**: 메인 DB\n- **Redis**: 캐싱\n\n## 인프라\n- **AWS**: 클라우드 인프라\n- **Docker**: 컨테이너화\n- **GitHub Actions**: CI/CD',
          category: 'tech',
          author: user?.displayName || 'System',
          authorId: user?.uid || 'system'
        }
      ];
      
      for (const page of initialPages) {
        await mockFirebase.firestore.collection('pages').add(page);
      }
      
      const initialTasks = [
        { title: '전자금융업 등록 요건 조사', status: 'in-progress', assignee: '김대표', priority: 'high', dueDate: '2025-11-01' },
        { title: 'MVP 기능 명세서 작성', status: 'in-progress', assignee: '박직원', priority: 'high', dueDate: '2025-10-25' },
        { title: '개발자 채용 JD 작성', status: 'todo', assignee: '김대표', priority: 'medium', dueDate: '2025-10-30' },
        { title: '투자 피칭 덱 준비', status: 'todo', assignee: '김대표', priority: 'high', dueDate: '2025-11-05' },
        { title: 'UI/UX 와이어프레임', status: 'todo', assignee: '박직원', priority: 'medium', dueDate: '2025-11-10' }
      ];
      
      for (const task of initialTasks) {
        await mockFirebase.firestore.collection('tasks').add(task);
      }
      
      const reloadedPages = await mockFirebase.firestore.collection('pages').get();
      const reloadedTasks = await mockFirebase.firestore.collection('tasks').get();
      setPages(reloadedPages);
      setTasks(reloadedTasks);
    } else {
      setPages(loadedPages);
      setTasks(loadedTasks);
    }
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('curvepay_currentUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      mockFirebase.auth.currentUser = parsedUser;
      loadData();
    } else {
      initializeDemoData();
    }
  }, [loadData, initializeDemoData]);

  const handleLogin = async () => {
    setLoginError('');
    try {
      const loggedInUser = await mockFirebase.auth.signIn(loginForm.email, loginForm.password);
      setUser(loggedInUser);
      await loadData();
    } catch (error) {
      setLoginError('로그인 실패: 이메일과 비밀번호를 확인하세요.');
    }
  };

  const handleSignup = async () => {
    setLoginError('');
    try {
      await mockFirebase.auth.signUp(loginForm.email, loginForm.password, loginForm.name, loginForm.role);
      alert('회원가입 성공! 로그인해주세요.');
      setLoginMode('login');
      setLoginForm({ email: '', password: '', name: '', role: 'employee' });
    } catch (error) {
      setLoginError(error.message || '회원가입 실패');
    }
  };

  const handleLogout = async () => {
    await mockFirebase.auth.signOut();
    setUser(null);
    setPages([]);
    setTasks([]);
    setSelectedPage(null);
    setActiveView('overview');
  };

  const canEdit = () => user?.role === 'admin';

  const categoryColors = {
    strategy: 'bg-blue-100 text-blue-800',
    legal: 'bg-red-100 text-red-800',
    tech: 'bg-green-100 text-green-800',
    design: 'bg-purple-100 text-purple-800',
    research: 'bg-yellow-100 text-yellow-800'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-green-100 text-green-700 border-green-300'
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
    if (!newPageTitle.trim()) {
      alert('페이지 제목을 입력하세요.');
      return;
    }
    if (!canEdit()) {
      alert('페이지 생성 권한이 없습니다. (관리자만 가능)');
      return;
    }
    
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
    setActiveView('page');
  };

  const deletePage = async (pageId) => {
    if (!canEdit()) {
      alert('페이지 삭제 권한이 없습니다. (관리자만 가능)');
      return;
    }
    if (!window.confirm('정말로 이 페이지를 삭제하시겠습니까?')) return;
    
    await mockFirebase.firestore.collection('pages').delete(pageId);
    setPages(prev => prev.filter(p => p.id !== pageId));
    if (selectedPage?.id === pageId) {
      setSelectedPage(null);
      setActiveView('overview');
    }
  };

  const updatePageContent = async (pageId, newContent) => {
    await mockFirebase.firestore.collection('pages').update(pageId, { content: newContent });
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, content: newContent } : p));
  };

  const updatePageCategory = async (pageId, newCategory) => {
    await mockFirebase.firestore.collection('pages').update(pageId, { category: newCategory });
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, category: newCategory } : p));
    if (selectedPage?.id === pageId) {
      setSelectedPage({ ...selectedPage, category: newCategory });
    }
  };

  const addNewTask = async (status) => {
    const titleToAdd = newTaskTitles[status];
    if (!titleToAdd.trim()) {
      alert('작업 제목을 입력하세요.');
      return;
    }
    
    const newTask = {
      title: titleToAdd,
      status: status,
      assignee: user.displayName,
      priority: 'medium',
      dueDate: null,
      description: ''
    };
    
    const added = await mockFirebase.firestore.collection('tasks').add(newTask);
    setTasks(prev => [...prev, added]);
    setNewTaskTitles(prev => ({ ...prev, [status]: '' }));
  };

  const moveTask = async (taskId, newStatus) => {
    await mockFirebase.firestore.collection('tasks').update(taskId, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('이 작업을 삭제하시겠습니까?')) return;
    await mockFirebase.firestore.collection('tasks').delete(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateTaskPriority = async (taskId, priority) => {
    await mockFirebase.firestore.collection('tasks').update(taskId, { priority });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority } : t));
  };

  const updateTaskDescription = async (taskId, description) => {
    await mockFirebase.firestore.collection('tasks').update(taskId, { description });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, description } : t));
  };

  const updateTaskDueDate = async (taskId, dueDate) => {
    await mockFirebase.firestore.collection('tasks').update(taskId, { dueDate });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate } : t));
  };

  const insertMarkdown = (prefix, suffix = '', needsNewLine = false) => {
    if (!editingPage || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = editingPage.content;
    
    const beforeCursor = content.substring(0, start);
    const lastNewLine = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
    const currentLine = content.substring(lineStart, end);
    
    let newContent, newCursorPos;
    
    if (needsNewLine) {
      const lineEnd = content.indexOf('\n', start);
      const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
      const restOfLine = content.substring(start, actualLineEnd);
      
      if (currentLine.trimStart().startsWith(prefix.trim())) {
        const withoutPrefix = currentLine.replace(prefix.trim(), '').trimStart();
        newContent = content.substring(0, lineStart) + withoutPrefix + content.substring(actualLineEnd);
        newCursorPos = lineStart + withoutPrefix.length;
      } else {
        newContent = content.substring(0, lineStart) + prefix + restOfLine + content.substring(actualLineEnd);
        newCursorPos = lineStart + prefix.length + restOfLine.length;
      }
    } else {
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
        newCursorPos = start + prefix.length + selectedText.length + suffix.length;
      } else {
        const placeholder = suffix ? '텍스트' : '';
        newContent = content.substring(0, start) + prefix + placeholder + suffix + content.substring(end);
        newCursorPos = start + prefix.length;
      }
    }
    
    setEditingPage({ ...editingPage, content: newContent });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderMarkdown = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLines = [];
    let codeLanguage = '';

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm">
              <code className={codeLanguage ? `language-${codeLanguage}` : ''}>{codeLines.join('\n')}</code>
            </pre>
          );
          codeLines = [];
          codeLanguage = '';
        } else {
          codeLanguage = line.substring(3).trim();
        }
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-2xl font-semibold mb-3 mt-5 text-gray-800 border-b border-gray-200 pb-2">{line.substring(4)}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-3xl font-semibold mb-4 mt-6 text-gray-800 border-b-2 border-gray-300 pb-2">{line.substring(3)}</h2>);
      } else if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-4xl font-bold mb-4 mt-8 text-gray-900 border-b-2 border-blue-500 pb-3">{line.substring(2)}</h1>);
      } else if (line.match(/^- \[ \] /)) {
        elements.push(
          <div key={i} className="flex items-start gap-2 ml-6 mb-2">
            <input type="checkbox" className="w-4 h-4 mt-1" disabled />
            <span>{line.substring(6)}</span>
          </div>
        );
      } else if (line.match(/^- \[x\] /) || line.match(/^- \[X\] /)) {
        elements.push(
          <div key={i} className="flex items-start gap-2 ml-6 mb-2">
            <input type="checkbox" checked className="w-4 h-4 mt-1" disabled />
            <span className="line-through text-gray-500">{line.substring(6)}</span>
          </div>
        );
      } else if (line.match(/^[*-] /)) {
        const content = line.substring(2);
        elements.push(<li key={i} className="ml-6 mb-1 list-disc">{processInlineMarkdown(content)}</li>);
      } else if (line.match(/^\d+\. /)) {
        const content = line.replace(/^\d+\. /, '');
        elements.push(<li key={i} className="ml-6 mb-1 list-decimal">{processInlineMarkdown(content)}</li>);
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-3 bg-blue-50 py-2 rounded-r">
            {processInlineMarkdown(line.substring(2))}
          </blockquote>
        );
      } else if (line.match(/^(-{3,}|_{3,}|\*{3,})$/)) {
        elements.push(<hr key={i} className="my-6 border-t-2 border-gray-300" />);
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="mb-2 leading-relaxed">
            {processInlineMarkdown(line)}
          </p>
        );
      }
    });

    return elements;
  };

  const processInlineMarkdown = (text) => {
    let processed = text;
    
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
    processed = processed.replace(/__(.+?)__/g, '<strong class="font-bold text-gray-900">$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em class="italic text-gray-800">$1</em>');
    processed = processed.replace(/_(.+?)_/g, '<em class="italic text-gray-800">$1</em>');
    processed = processed.replace(/`(.+?)`/g, '<code class="bg-gray-200 px-2 py-0.5 rounded text-sm font-mono text-red-600">$1</code>');
    processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
  };

  // 필터링된 페이지
  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         page.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || page.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // 필터링된 작업
  const filteredTasks = tasks.filter(task => {
    const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
    return matchesAssignee;
  });

  // 고유 담당자 목록
  const uniqueAssignees = [...new Set(tasks.map(t => t.assignee))];

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
              onClick={() => { setLoginMode('login'); setLoginError(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                loginMode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => { setLoginMode('signup'); setLoginError(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                loginMode === 'signup' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              회원가입
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            {loginMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="홍길동"
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
                placeholder="example@curvepay.kr"
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
                placeholder="••••••••"
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

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-700 font-medium mb-2">💡 데모 계정</p>
            <p className="text-xs text-gray-600 mb-1">👨‍💼 관리자: admin@curvepay.kr / admin123</p>
            <p className="text-xs text-gray-600">👤 직원: employee@curvepay.kr / emp123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">CurvePay Korea</h1>
          <div className="flex items-center gap-2 mt-2">
            <UserCircle className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600 flex-1 truncate">{user.displayName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
              {user.role === 'admin' ? '👑' : '👤'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {canEdit() && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewPage()}
                  placeholder="새 페이지 제목"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addNewPage} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            <button
              onClick={() => setActiveView('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                activeView === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Folder className="w-4 h-4" />
              대시보드
            </button>

            <button
              onClick={() => setActiveView('kanban')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
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
                        setEditingPage(null);
                      }}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedPage?.id === page.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{page.title}</span>
                    </button>
                    {canEdit() && (
                      <button
                        onClick={() => deletePage(page.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-opacity"
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeView === 'overview' && '프로젝트 대시보드'}
              {activeView === 'kanban' && '작업 칸반 보드'}
              {activeView === 'page' && selectedPage?.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {activeView === 'overview' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="페이지 검색..."
                    className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 카테고리</option>
                  <option value="strategy">전략</option>
                  <option value="legal">법규</option>
                  <option value="tech">기술</option>
                  <option value="design">디자인</option>
                  <option value="research">리서치</option>
                </select>
              </div>
            )}
            
            {activeView === 'kanban' && (
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 담당자</option>
                {uniqueAssignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setAiChatOpen(!aiChatOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              AI 어시스턴트
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeView === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">총 페이지</span>
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{pages.length}</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">진행 중</span>
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.status === 'in-progress').length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">완료</span>
                    <CheckSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.status === 'done').length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">대기</span>
                    <CheckSquare className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.status === 'todo').length}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  페이지 목록 {searchQuery && `(검색: "${searchQuery}")`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPages.map(page => (
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
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 truncate">{page.title}</h4>
                        <p className="text-xs text-gray-500">작성자: {page.author}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[page.category]}`}>
                            {page.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredPages.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      검색 결과가 없습니다.
                    </div>
                  )}
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
                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                        {filteredTasks.filter(t => t.status === status).length}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTaskTitles[status]}
                          onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [status]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addNewTask(status);
                            }
                          }}
                          placeholder="새 작업 추가..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => addNewTask(status)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredTasks.filter(t => t.status === status).map(task => (
                        <div 
                          key={task.id} 
                          className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow group cursor-pointer"
                          onClick={() => {
                            setSelectedTask(task);
                            setTaskDetailOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900 flex-1">{task.title}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-opacity ml-2"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{task.assignee}</span>
                          </div>

                          {task.dueDate && (
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{task.dueDate}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <select
                              value={task.priority}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateTaskPriority(task.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-xs px-2 py-1 rounded border ${priorityColors[task.priority]}`}
                            >
                              <option value="high">🔴 높음</option>
                              <option value="medium">🟡 보통</option>
                              <option value="low">🟢 낮음</option>
                            </select>

                            <div className="flex gap-1">
                              {status !== 'todo' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTask(task.id, status === 'in-progress' ? 'todo' : 'in-progress');
                                  }}
                                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                  title="이전 단계로"
                                >
                                  ←
                                </button>
                              )}
                              {status !== 'done' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTask(task.id, status === 'todo' ? 'in-progress' : 'done');
                                  }}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                  title="다음 단계로"
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
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {editingPage?.id === selectedPage.id ? (
                  <div>
                    <div className="border-b border-gray-200 p-3 bg-gray-50">
                      <div className="flex items-center gap-1 flex-wrap">
                        <div className="flex gap-1 pr-2 border-r border-gray-300">
                          <button
                            onClick={() => insertMarkdown('**', '**')}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Bold"
                          >
                            <Bold className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('*', '*')}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Italic"
                          >
                            <Italic className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('`', '`')}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Code"
                          >
                            <Code className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex gap-1 px-2 border-r border-gray-300">
                          <button
                            onClick={() => insertMarkdown('# ', '', true)}
                            className="px-2 py-1 hover:bg-gray-200 rounded text-sm font-bold transition-colors"
                            title="H1"
                          >
                            H1
                          </button>
                          <button
                            onClick={() => insertMarkdown('## ', '', true)}
                            className="px-2 py-1 hover:bg-gray-200 rounded text-sm font-bold transition-colors"
                            title="H2"
                          >
                            H2
                          </button>
                          <button
                            onClick={() => insertMarkdown('### ', '', true)}
                            className="px-2 py-1 hover:bg-gray-200 rounded text-sm font-bold transition-colors"
                            title="H3"
                          >
                            H3
                          </button>
                        </div>
                        
                        <div className="flex gap-1 px-2 border-r border-gray-300">
                          <button
                            onClick={() => insertMarkdown('- ', '', true)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Bullet List"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('1. ', '', true)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Numbered List"
                          >
                            <ListOrdered className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('- [ ] ', '', true)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Checklist"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex gap-1 px-2">
                          <button
                            onClick={() => insertMarkdown('[', '](url)')}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Link"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('> ', '', true)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Quote"
                          >
                            <Quote className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('```\n', '\n```')}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Code Block"
                          >
                            <Code className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('---\n', '', true)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Horizontal Rule"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1" />
                        
                        <button
                          onClick={() => setEditorMode(editorMode === 'edit' ? 'preview' : 'edit')}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                        >
                          {editorMode === 'edit' ? (
                            <>
                              <Eye className="w-4 h-4" />
                              <span>미리보기</span>
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-4 h-4" />
                              <span>편집</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={`grid ${editorMode === 'edit' ? 'grid-cols-2' : 'grid-cols-1'} divide-x divide-gray-200`}>
                      {editorMode === 'edit' && (
                        <div className="p-6 bg-gray-50">
                          <textarea
                            ref={textareaRef}
                            value={editingPage.content}
                            onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                            className="w-full h-[600px] font-mono text-sm focus:outline-none resize-none leading-relaxed bg-white p-4 rounded border border-gray-200"
                            placeholder="마크다운으로 작성하세요..."
                          />
                        </div>
                      )}
                      
                      <div className="p-8 overflow-y-auto h-[600px] prose prose-lg max-w-none bg-white">
                        {renderMarkdown(editingPage.content)}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 p-4 flex gap-2 bg-gray-50">
                      <button
                        onClick={() => {
                          updatePageContent(selectedPage.id, editingPage.content);
                          setSelectedPage({ ...selectedPage, content: editingPage.content });
                          setEditingPage(null);
                          alert('✅ 저장되었습니다!');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium"
                      >
                        <Save className="w-4 h-4" />
                        저장
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('변경사항을 취소하시겠습니까?')) {
                            setEditingPage(null);
                          }
                        }}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-center gap-3 flex-wrap">
                        {canEdit() && (
                          <select
                            value={selectedPage.category}
                            onChange={(e) => updatePageCategory(selectedPage.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${categoryColors[selectedPage.category]}`}
                          >
                            <option value="strategy">전략</option>
                            <option value="legal">법규</option>
                            <option value="tech">기술</option>
                            <option value="design">디자인</option>
                            <option value="research">리서치</option>
                          </select>
                        )}
                        {!canEdit() && (
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[selectedPage.category]}`}>
                            {selectedPage.category.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-gray-500">작성자: {selectedPage.author}</span>
                        {selectedPage.updatedAt && (
                          <span className="text-xs text-gray-400">
                            수정: {new Date(selectedPage.updatedAt).toLocaleString('ko-KR')}
                          </span>
                        )}
                      </div>
                      {canEdit() && (
                        <button
                          onClick={() => setEditingPage(selectedPage)}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

      {/* AI Chat Panel */}
      {aiChatOpen && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">AI 어시스턴트</h3>
            </div>
            <button onClick={() => setAiChatOpen(false)} className="p-1 hover:bg-gray-200 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">안녕하세요, {user.displayName}님! 👋</p>
                <p className="text-xs text-gray-500 mb-4">CurvePay Korea에 대해<br />무엇이든 물어보세요</p>
                <div className="text-left space-y-2">
                  <p className="text-xs text-gray-500 font-medium">추천 질문:</p>
                  <button
                    onClick={() => setChatInput('전자금융업 등록 절차를 단계별로 알려줘')}
                    className="w-full text-left text-xs p-2 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                  >
                    💼 전자금융업 등록 절차는?
                  </button>
                  <button
                    onClick={() => setChatInput('토스와 차별화할 수 있는 전략 3가지')}
                    className="w-full text-left text-xs p-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    🎯 차별화 전략 제안해줘
                  </button>
                  <button
                    onClick={() => setChatInput('MVP 개발에 필요한 핵심 기능 5가지')}
                    className="w-full text-left text-xs p-2 bg-green-50 rounded hover:bg-green-100 transition-colors"
                  >
                    🚀 MVP 핵심 기능은?
                  </button>
                </div>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {taskDetailOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">작업 상세</h2>
              <button
                onClick={() => {
                  setTaskDetailOpen(false);
                  setSelectedTask(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={selectedTask.title}
                  onChange={(e) => {
                    const updated = { ...selectedTask, title: e.target.value };
                    setSelectedTask(updated);
                    mockFirebase.firestore.collection('tasks').update(selectedTask.id, { title: e.target.value });
                    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    moveTask(selectedTask.id, newStatus);
                    setSelectedTask({ ...selectedTask, status: newStatus });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">📋 할 일</option>
                  <option value="in-progress">⚡ 진행 중</option>
                  <option value="done">✅ 완료</option>
                </select>
              </div>

              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => {
                    const newPriority = e.target.value;
                    updateTaskPriority(selectedTask.id, newPriority);
                    setSelectedTask({ ...selectedTask, priority: newPriority });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg ${priorityColors[selectedTask.priority]}`}
                >
                  <option value="high">🔴 높음</option>
                  <option value="medium">🟡 보통</option>
                  <option value="low">🟢 낮음</option>
                </select>
              </div>

              {/* 담당자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{selectedTask.assignee}</span>
                </div>
              </div>

              {/* 마감일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">마감일</label>
                <input
                  type="date"
                  value={selectedTask.dueDate || ''}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    updateTaskDueDate(selectedTask.id, newDate);
                    setSelectedTask({ ...selectedTask, dueDate: newDate });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea
                  value={selectedTask.description || ''}
                  onChange={(e) => {
                    const newDesc = e.target.value;
                    setSelectedTask({ ...selectedTask, description: newDesc });
                  }}
                  onBlur={(e) => {
                    updateTaskDescription(selectedTask.id, e.target.value);
                  }}
                  placeholder="작업에 대한 자세한 설명을 입력하세요..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                />
              </div>

              {/* 생성/수정 정보 */}
              <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                {selectedTask.createdAt && (
                  <p>생성: {new Date(selectedTask.createdAt).toLocaleString('ko-KR')}</p>
                )}
                {selectedTask.updatedAt && (
                  <p>수정: {new Date(selectedTask.updatedAt).toLocaleString('ko-KR')}</p>
                )}
              </div>

              {/* 삭제 버튼 */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (window.confirm('이 작업을 삭제하시겠습니까?')) {
                      deleteTask(selectedTask.id);
                      setTaskDetailOpen(false);
                      setSelectedTask(null);
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  작업 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurvePayWorkspace;