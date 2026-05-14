import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const UsageCounter = forwardRef(({ teacherId, toolName, onLimitExceeded }, ref) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUsage = async () => {
    try {
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
      const response = await fetch(`${apiBase}/api/check-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, tool_name: toolName })
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Error checking usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: () => checkUsage()
  }));

  useEffect(() => {
    if (teacherId && toolName) {
      checkUsage();
    }
  }, [teacherId, toolName]);

  if (loading || !usage) {
    return <span style={{ fontSize: '0.9rem', color: '#64748b' }}>...</span>;
  }

  const isExceeded = usage.exceeded;
  const isWarning = usage.usage_count >= 40;

  // Simple inline badge format: "1/50"
  let color = isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

  return (
    <span
      title={isExceeded ? 'Limit exceeded! Try again tomorrow' : `${usage.remaining} uses remaining`}
      style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        color: color,
        padding: '2px 6px',
        backgroundColor: 'transparent',
        borderRadius: '4px'
      }}
    >
      {usage.usage_count}/{usage.limit}
    </span>
  );
});

UsageCounter.displayName = 'UsageCounter';
export default UsageCounter;
