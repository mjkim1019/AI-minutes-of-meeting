# 📄 EchoNote - Product Requirements Document (PRD)

## 1️⃣ 제품 개요
- **제품 이름**: EchoNote
- **핵심 목표**:  
  - AI 음성 인식을 활용하여 **회의록 자동 작성**  
  - **회의 핵심 내용 요약 및 후속 작업 정리**  
  - **기업 회의(기획 회의, 개발 회의 등)에서 정확한 용어 인식 & 정리**  
- **주요 사용자**: IT·통신 업계 회사원 (기획자, 개발자, 운영팀, 고객지원팀 등)  
- **사용 사례**:  
  - 일반 기획 회의  
  - 프로젝트 진행 회의  
  - 기술 논의 회의  
  - 팀 내 정기 회의  

---

## 2️⃣ 주요 기능  

### 1. 실시간 음성 인식 & 회의록 작성  
✅ 회의 음성을 자동으로 텍스트 변환 (STT)  
✅ 다중 화자 인식 (발언자 구분)  
✅ 특정 키워드 강조 (예: ‘중요’, ‘결정’, ‘후속 작업’)  

### 2. 핵심 내용 요약  
✅ AI 자동 요약 기능  
✅ 의사결정 사항 및 논의된 대안 정리  
✅ 대화의 맥락을 고려한 스마트 요약  

### 3. 후속 작업 정리  
✅ 담당자별 To-Do 리스트 자동 생성  
✅ 마감일 & 우선순위 설정  
✅ 캘린더 / 프로젝트 관리 툴 연동 (Jira, Trello, Notion 등)  

### 4. 전문 용어 & 커스텀 키워드 지원  
✅ IT·통신 업계 용어 인식 최적화  
✅ 사용자가 자주 쓰는 용어 추가 가능  
✅ 회사별 맞춤 용어집 적용  

### 5. 다국어 지원 (선택 기능)  
✅ 한국어 & 영어 등 다국어 회의록 변환 가능  

### 6. 파일 & 문서 저장 및 공유  
✅ 회의록 PDF / Word 파일 저장 및 공유  
✅ 이메일 & 슬랙 등 협업 툴 연동  

### 7. 보안 & 접근 권한 관리  
✅ 회의 내용 암호화 저장  
✅ 회사 내부 접근 권한 설정  

---

## 3️⃣ 기술 스택  
🔹 **프론트엔드 & 백엔드**: Next.js (Full-stack)  
🔹 **데이터베이스**: Superbase (PostgreSQL)  
🔹 **AI 엔진**: OpenAI Whisper (STT), GPT (요약 기능)  
🔹 **배포 환경**: Vercel  

---

## 4️⃣ 향후 확장 기능 (V2, V3 고려)  
✨ 회의 음성을 자동으로 번역하여 다국어 회의록 지원  
✨ GPT 기반 회의 Q&A 기능 (ex: "이 회의에서 결정된 주요 내용은?")  
✨ 모바일 앱 제공 (iOS, Android)  