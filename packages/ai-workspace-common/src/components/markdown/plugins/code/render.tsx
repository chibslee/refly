import { useRef, useCallback } from 'react';
import { Message as message } from '@arco-design/web-react';
import copyToClipboard from 'copy-to-clipboard';
import { useTranslation } from 'react-i18next';
import React from 'react';

const PreCode = React.memo(({ children }: { children: any }) => {
  const ref = useRef<HTMLPreElement>(null);
  const { t } = useTranslation();

  const handleCopy = useCallback(() => {
    if (ref.current) {
      // Find the code element inside pre and get its text content
      const codeElement = ref.current.querySelector('code');
      const code = codeElement?.textContent ?? '';
      copyToClipboard(code);
      message.success(t('components.markdown.copySuccess'));
    }
  }, [t]);

  return (
    <pre ref={ref}>
      <span className="copy-code-button" onClick={handleCopy}>
        {t('copilot.message.copy')}
      </span>
      {children}
    </pre>
  );
});

PreCode.displayName = 'PreCode';

export default PreCode;
