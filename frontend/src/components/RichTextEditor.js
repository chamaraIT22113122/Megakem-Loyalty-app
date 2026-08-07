import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Select, 
  MenuItem, 
  Divider, 
  Typography, 
  Paper, 
  Popover, 
  Button, 
  TextField 
} from '@mui/material';
import { 
  FormatBold, 
  FormatItalic, 
  FormatUnderlined, 
  StrikethroughS, 
  FormatAlignLeft, 
  FormatAlignCenter, 
  FormatAlignRight, 
  FormatAlignJustify, 
  FormatListBulleted, 
  FormatListNumbered, 
  FormatColorText, 
  FormatColorFill, 
  InsertLink, 
  FormatClear, 
  Undo, 
  Redo 
} from '@mui/icons-material';

const RichTextEditor = ({ value = '', onChange, placeholder = 'Write product detailed description...' }) => {
  const editorRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [formatBlock, setFormatBlock] = useState('p');
  
  // Link Popover state
  const [linkAnchorEl, setLinkAnchorEl] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');

  // Sync internal content with external value prop
  useEffect(() => {
    if (editorRef.current) {
      let formattedVal = value || '';
      // If plain text with newlines, convert to html paragraphs for rich structure
      if (formattedVal && !/<[a-z][\s\S]*>/i.test(formattedVal)) {
        formattedVal = formattedVal
          .split(/\n+/)
          .filter(p => p.trim().length > 0)
          .map(p => `<p>${p.trim()}</p>`)
          .join('');
      }
      if (editorRef.current.innerHTML !== formattedVal) {
        editorRef.current.innerHTML = formattedVal;
        updateCounts();
      }
    }
  }, [value]);

  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    setCharCount(text.length);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  const handleInput = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
    updateCounts();
  };

  const execCmd = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  };

  const handleHeadingChange = (e) => {
    const tag = e.target.value;
    setFormatBlock(tag);
    execCmd('formatBlock', `<${tag}>`);
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      execCmd('createLink', linkUrl);
      setLinkUrl('');
      setLinkAnchorEl(null);
    }
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        borderRadius: 2.5, 
        overflow: 'hidden', 
        borderColor: '#cbd5e1',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: '0 0 0 3px rgba(0, 51, 102, 0.15)'
        }
      }}
    >
      {/* TinyMCE-styled Top Toolbar */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          gap: 0.5, 
          p: 1, 
          bgcolor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0' 
        }}
      >
        <Tooltip title="Undo">
          <IconButton size="small" onClick={() => execCmd('undo')}>
            <Undo fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton size="small" onClick={() => execCmd('redo')}>
            <Redo fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Format Block Dropdown */}
        <Select
          size="small"
          value={formatBlock}
          onChange={handleHeadingChange}
          sx={{ height: 32, fontSize: '0.8rem', bgcolor: 'white', borderRadius: 1.5 }}
        >
          <MenuItem value="p">Paragraph</MenuItem>
          <MenuItem value="h1">Heading 1</MenuItem>
          <MenuItem value="h2">Heading 2</MenuItem>
          <MenuItem value="h3">Heading 3</MenuItem>
        </Select>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Formatting Buttons */}
        <Tooltip title="Bold (Ctrl+B)">
          <IconButton size="small" onClick={() => execCmd('bold')}>
            <FormatBold fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic (Ctrl+I)">
          <IconButton size="small" onClick={() => execCmd('italic')}>
            <FormatItalic fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline (Ctrl+U)">
          <IconButton size="small" onClick={() => execCmd('underline')}>
            <FormatUnderlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Strikethrough">
          <IconButton size="small" onClick={() => execCmd('strikeThrough')}>
            <StrikethroughS fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Alignments */}
        <Tooltip title="Align Left">
          <IconButton size="small" onClick={() => execCmd('justifyLeft')}>
            <FormatAlignLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Center">
          <IconButton size="small" onClick={() => execCmd('justifyCenter')}>
            <FormatAlignCenter fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Right">
          <IconButton size="small" onClick={() => execCmd('justifyRight')}>
            <FormatAlignRight fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Justify">
          <IconButton size="small" onClick={() => execCmd('justifyFull')}>
            <FormatAlignJustify fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Lists */}
        <Tooltip title="Bulleted List">
          <IconButton size="small" onClick={() => execCmd('insertUnorderedList')}>
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton size="small" onClick={() => execCmd('insertOrderedList')}>
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Insert Link */}
        <Tooltip title="Insert Link">
          <IconButton size="small" onClick={(e) => setLinkAnchorEl(e.currentTarget)}>
            <InsertLink fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Text Colors */}
        <Tooltip title="Text Color (Primary)">
          <IconButton size="small" onClick={() => execCmd('foreColor', '#003366')}>
            <FormatColorText fontSize="small" style={{ color: '#003366' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Highlight (Yellow)">
          <IconButton size="small" onClick={() => execCmd('hiliteColor', '#fef08a')}>
            <FormatColorFill fontSize="small" style={{ color: '#eab308' }} />
          </IconButton>
        </Tooltip>

        {/* Clear Formatting */}
        <Tooltip title="Clear Formatting">
          <IconButton size="small" onClick={() => execCmd('removeFormat')}>
            <FormatClear fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Editor Content editable Area */}
      <Box
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        sx={{
          minHeight: 180,
          maxHeight: 340,
          overflowY: 'auto',
          p: 2.5,
          outline: 'none',
          fontSize: '0.92rem',
          lineHeight: 1.7,
          color: '#1e293b',
          fontFamily: 'inherit',
          '& p': { mb: 1.5, mt: 0, '&:last-child': { mb: 0 } },
          '& strong, & b': { color: '#003366', fontWeight: 800 },
          '& h1': { fontSize: '1.4rem', fontWeight: 800, my: 1, color: '#003366' },
          '& h2': { fontSize: '1.2rem', fontWeight: 700, my: 0.8, color: '#003366' },
          '& h3': { fontSize: '1.05rem', fontWeight: 700, my: 0.6, color: '#003366' },
          '& ul, & ol': { pl: 3, mb: 1.5, '& li': { mb: 0.5 } },
          '&:empty::before': {
            content: `"${placeholder}"`,
            color: 'text.disabled',
            pointerEvents: 'none',
            display: 'block'
          }
        }}
      />

      {/* Bottom Status Bar (Word / Char Counter) */}
      <Box 
        sx={{ 
          display: 'flex', 
          justify: 'space-between', 
          alignItems: 'center', 
          px: 2, 
          py: 0.6, 
          bgcolor: '#f8fafc', 
          borderTop: '1px solid #e2e8f0',
          color: 'text.secondary',
          fontSize: '0.72rem'
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
          p
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
            {wordCount} words | {charCount} chars
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'primary.main', fontWeight: 800 }}>
            ✨ Rich Editor Active
          </Typography>
        </Box>
      </Box>

      {/* Insert Link Popover */}
      <Popover
        open={Boolean(linkAnchorEl)}
        anchorEl={linkAnchorEl}
        onClose={() => setLinkAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField 
            size="small" 
            label="URL (e.g. https://...)" 
            value={linkUrl} 
            onChange={(e) => setLinkUrl(e.target.value)} 
          />
          <Button variant="contained" size="small" onClick={handleInsertLink}>
            Insert
          </Button>
        </Box>
      </Popover>
    </Paper>
  );
};

export default RichTextEditor;
