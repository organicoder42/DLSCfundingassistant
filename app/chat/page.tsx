import ChatContainer from '@/components/chat/ChatContainer';

export const metadata = {
  title: 'Chat - DLSC Funding Assistant',
  description: 'Få hjælp fra vores AI assistant til at finde funding muligheder',
};

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChatContainer />
      </div>
    </div>
  );
}
