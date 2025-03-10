# 베이스 이미지로 Node.js 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install
RUN npm install -D @types/node typescript @types/react @types/react-dom @types/react-is
RUN npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 포트 설정
EXPOSE 3000

# 실행 명령어
CMD ["npm", "start"] 