import { useVAD } from '@/context/vad-context';
import { useAiState } from '@/context/ai-state-context';
import { toaster } from '@/components/ui/toaster';

export function useMicToggle() {
  const { startMic, stopMic, micOn, isMicGranted } = useVAD();
  const { aiState, setAiState } = useAiState();

  const handleMicToggle = async (): Promise<void> => {
    if (micOn) {
      stopMic();
      if (aiState === 'listening') {
        setAiState('idle');
      }
    } else {
      if (!isMicGranted) {
        toaster.create({
          title: "Microphone unavailable: server capability grant required",
          type: "error",
          duration: 3000,
        });
        return;
      }
      await startMic();
    }
  };

  return {
    handleMicToggle,
    micOn,
    isMicGranted,
  };
}
