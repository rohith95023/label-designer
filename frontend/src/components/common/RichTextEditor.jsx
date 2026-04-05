import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

/**
 * RichTextEditor - A contentEditable wrapper for inline label formatting.
 * Supports: Bold, Italic, Underline, Strikethrough, Color, Font Family/Size, Alignment, and Superscript.
 */
const RichTextEditor = forwardRef(({ 
  html, 
  onChange, 
  onBlur, 
  onResize,
  onSelectionChange,
  placeholder = 'Enter text...', 
  style = {},
  autoFocus = true
}, ref) => {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);

  // Expose format method to parent
  useImperativeHandle(ref, () => ({
    format: (cmd, value = null, savedRange = null) => {
      console.log(`[RichTextEditor] Formatting command: ${cmd}, value: ${value}`);
      if (editorRef.current) {
        // Determine the range to restore
        const rangeToRestore = savedRange || selectionRef.current;

        // Restore selection BEFORE focusing, so focus doesn't clobber it
        if (rangeToRestore) {
          editorRef.current.focus();
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(rangeToRestore);
        } else {
          editorRef.current.focus();
        }

        // hiliteColor requires styleWithCSS:true; toggle around the command
        if (cmd === 'hiliteColor') {
          document.execCommand('styleWithCSS', false, true);
        }

        const success = document.execCommand(cmd, false, value);
        console.log(`[RichTextEditor] Formatting success: ${success}`);

        // Restore styleWithCSS to false (use tags, not inline styles)
        if (cmd === 'hiliteColor') {
          document.execCommand('styleWithCSS', false, false);
        }
        
        // Use setTimeout to ensure DOM is updated before querying state
        setTimeout(() => {
          // Final sync
          const newHtml = editorRef.current.innerHTML;
          const newText = editorRef.current.innerText;
          onChange({ html: newHtml, text: newText });
          
          // Update active states after formatting
          if (onSelectionChange) {
            onSelectionChange({
              bold: document.queryCommandState('bold'),
              italic: document.queryCommandState('italic'),
              underline: document.queryCommandState('underline'),
              strikeThrough: document.queryCommandState('strikeThrough'),
            });
          }
        }, 0);
      }
    },
    queryCommandState: (cmd) => {
      return document.queryCommandState(cmd);
    },
    getActiveStates: () => {
      return {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
      };
    }
  }));

  // Preserve selection range for robust header-toolbar interactions
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      selectionRef.current = sel.getRangeAt(0).cloneRange();
      if (onSelectionChange) {
        onSelectionChange({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
        });
      }
    }
  }, [onSelectionChange]);

  // Initial mount sync - ALWAYS set content once
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html || '';
    }
  }, []); // Run ONLY once on mount

  // Sync external HTML changes (e.g. from presets) on update, 
  // but only when NOT focused to avoid cursor jumping while typing
  useEffect(() => {
    if (editorRef.current && 
        document.activeElement !== editorRef.current && 
        editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html || '';
    }
  }, [html]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      const newText = editorRef.current.innerText;
      
      // Auto-resize logic: expand if content exceeds height
      const currentHeight = editorRef.current.offsetHeight;
      const scrollHeight = editorRef.current.scrollHeight;
      if (scrollHeight > currentHeight && onResize) {
        onResize({ height: scrollHeight + 4 }); // Add small buffer
      }

      onChange({ html: newHtml, text: newText });
      saveSelection();
    }
  }, [onChange, onResize, saveSelection]);

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); document.execCommand('bold', false, null); break;
        case 'i': e.preventDefault(); document.execCommand('italic', false, null); break;
        case 'u': e.preventDefault(); document.execCommand('underline', false, null); break;
        default: break;
      }
      // Update active states after keyboard formatting
      if (onSelectionChange) {
        onSelectionChange({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
        });
      }
      handleInput(); // Sync
    }
    saveSelection();
  };

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
      // Ensure browser uses tags (<b>, <i>) instead of styles
      document.execCommand('styleWithCSS', false, false);
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      saveSelection();
    }
  }, [autoFocus, saveSelection]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className="rich-text-editor outline-none w-full h-full min-h-[1.5em] select-text"
      onInput={handleInput}
      onFocus={saveSelection}
      onBlur={(e) => {
        saveSelection();
        if (onBlur) onBlur(e);
      }}
      onKeyDown={handleKeyDown}
      onMouseUp={saveSelection}
      onKeyUp={saveSelection}
      placeholder={placeholder}
      style={{
        ...style,
        outline: 'none',
        border: 'none',
        background: 'transparent',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        overflow: 'visible', // Never clip text while editing
        padding: '0 4px', // Small padding to prevent clipping at edges
        margin: 0
      }}
    ></div>
  );
});

export default RichTextEditor;
