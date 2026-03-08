import { AnimatePresence, cubicBezier, motion } from 'framer-motion';

interface SendButtonProps {
  show: boolean;
  isStreaming?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onImagesSelected?: (images: File[]) => void;
}

const customEasingFn = cubicBezier(0.4, 0, 0.2, 1);

export const SendButton = ({ show, isStreaming, disabled, onClick }: SendButtonProps) => {
  return (
    <AnimatePresence>
      {show ? (
        <motion.button
          className="group absolute flex justify-center items-center top-[16px] right-[16px] py-1.5 bg-[#FC7C11] hover:bg-[#5A8FD8] text-white rounded-full h-[32px] transition-all duration-200 transform-gpu active:scale-95 border border-[#FC7C11]/20 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
          style={{ paddingLeft: '0.4rem', paddingRight: '0.4rem' }}
          transition={{ ease: customEasingFn, duration: 0.17 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          disabled={disabled}
          onClick={(event) => {
            event.preventDefault();

            if (!disabled) {
              onClick?.(event);
            }
          }}
        >
          <div className="text-lg transition-all duration-200 group-hover:scale-110 group-active:scale-95">
            {!isStreaming ? (
              <div className="i-ph:arrow-right drop-shadow-sm"></div>
            ) : (
              <div className="i-ph:stop-circle-bold drop-shadow-sm"></div>
            )}
          </div>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
};
