'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme';

// ─── Layer Data ──────────────────────────────────────────────────
const LAYERS = [
  {
    id: 'background',
    name: 'Layer 0 — Background',
    shortName: 'Background',
    depth: 0,
    color: '#2d5a1e',
    borderColor: '#4a8a30',
    description: 'Full-screen animated background. Sets the mood and provides color for the glass to refract.',
    elements: ['Aurora orbs', 'Morphing blobs', 'Color bands', 'Mesh gradients', 'Dot grid + color pools', 'Future: Dynamic sport surfaces'],
    css: ['position: fixed', 'z-index: 0', 'radial-gradient / conic-gradient', 'filter: blur(40px)', '@keyframes (drift, morph, rotate)'],
    cssKey: 'Background surface',
    targetable: true,
    notes: 'This is what you see THROUGH the glass. More visual contrast here = more visible glass effect.',
  },
  {
    id: 'section',
    name: 'Layer 1 — Glass Section',
    shortName: 'Section',
    depth: 1,
    color: '#3a6b4a',
    borderColor: '#5a9b6a',
    description: 'Container that groups cards. Frosted panel with subtle blur. Holds section headers.',
    elements: ['"LIVE NOW" header', '"7 PM ET" time groups', '"Completed" sections', 'Section divider lines', 'Count badges'],
    css: ['glass-section class', 'backdrop-filter: blur()', 'rgba background (low opacity)', 'border: 1px solid rgba(…)', 'border-radius: 12-16px'],
    cssKey: 'Glass container',
    targetable: true,
    notes: 'This creates the first level of depth. Cards sit INSIDE these sections.',
  },
  {
    id: 'glass-card',
    name: 'Layer 2 — Glass Card',
    shortName: 'Card Glass',
    depth: 2,
    color: '#4a7a5a',
    borderColor: '#6aaa7a',
    description: 'The frosted glass surface of each game card. Gets blur, distortion, shimmer, specular highlights. Content does NOT live here.',
    elements: ['backdrop-filter: blur()', 'SVG distortion (feTurbulence)', 'Specular highlight band (top)', 'Specular edge lines (sides)', 'Shimmer sweep animation', 'Glass surface texture', 'Box shadow (depth)'],
    css: ['glass-match-card class', 'backdrop-filter: blur(12-16px)', 'filter: url(#glass-distort)', 'position: absolute; inset: 0', 'linear-gradient overlays', '@keyframes shimmerSweep', 'box-shadow with inset highlights'],
    cssKey: 'Glass surface (no content)',
    targetable: true,
    notes: 'KEY INSIGHT: This layer is position: absolute. It\'s a sibling to the content, NOT a parent. CSS filters here do NOT affect content.',
  },
  {
    id: 'content',
    name: 'Layer 3 — Content Objects',
    shortName: 'Content',
    depth: 3,
    color: '#ffffff',
    borderColor: '#ffffff',
    description: 'Solid, opaque objects sitting ON TOP of the glass. Zero transparency. Each element has its own backing and shadow.',
    elements: ['Team logos (in dark circle backing)', 'Team names (bold + text-shadow)', 'Score box (solid dark background)', 'Status badges (solid red / dark)', 'League badges (opaque pills)', 'Broadcast text (bold + shadow)'],
    css: ['position: relative; z-index: 5', 'backgroundColor: rgba(0,0,0,0.6-0.7)', 'color: #ffffff (pure white)', 'textShadow: 0 1px 5px rgba(…)', 'boxShadow: 0 3px 10px rgba(…)', 'filter: brightness(1.2) on logos', 'font-weight: bold (700)'],
    cssKey: 'Solid objects on glass',
    targetable: true,
    notes: 'These are PHYSICAL OBJECTS on a glass table. Never transparent, never blurred, never filtered by the glass below.',
  },
];

// ─── Exploded Layer Card ─────────────────────────────────────────
function LayerCard({
  layer,
  isExpanded,
  onToggle,
  isHighlighted,
  onHover,
  darkMode,
}: {
  layer: typeof LAYERS[0];
  isExpanded: boolean;
  onToggle: () => void;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  darkMode: boolean;
}) {
  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => onHover(layer.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '16px 20px',
        cursor: 'pointer',
        backgroundColor: darkMode
          ? isHighlighted ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'
          : isHighlighted ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.02)',
        border: `2px solid ${isHighlighted ? layer.borderColor : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
        transition: 'all 0.3s ease',
        transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isHighlighted
          ? `0 4px 20px ${layer.color}33, inset 0 1px 0 rgba(255,255,255,0.05)`
          : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isExpanded ? 16 : 0 }}>
        {/* Depth indicator */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: layer.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 8px ${layer.color}66`,
          flexShrink: 0,
        }}>
          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 18, fontFamily: 'JetBrains Mono, monospace' }}>
            {layer.depth}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 16, fontWeight: 700, margin: 0,
            color: darkMode ? '#ffffff' : '#1a2a12',
          }}>{layer.name}</h3>
          <p style={{
            fontSize: 13, margin: '2px 0 0', fontStyle: 'italic',
            color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
          }}>{layer.cssKey}</p>
        </div>

        {/* Expand arrow */}
        <span style={{
          fontSize: 20, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}>▾</span>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Description */}
          <p style={{
            fontSize: 14, lineHeight: 1.5, margin: 0,
            color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
          }}>{layer.description}</p>

          {/* Two columns: Elements + CSS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* What lives here */}
            <div style={{
              borderRadius: 10, padding: '12px 14px',
              backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
            }}>
              <h4 style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: layer.borderColor, margin: '0 0 8px',
              }}>What Lives Here</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {layer.elements.map((el, i) => (
                  <li key={i} style={{
                    fontSize: 12, padding: '3px 0',
                    color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: layer.borderColor, flexShrink: 0 }} />
                    {el}
                  </li>
                ))}
              </ul>
            </div>

            {/* CSS used */}
            <div style={{
              borderRadius: 10, padding: '12px 14px',
              backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
            }}>
              <h4 style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: layer.borderColor, margin: '0 0 8px',
              }}>CSS / Properties</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {layer.css.map((prop, i) => (
                  <li key={i} style={{
                    fontSize: 11, padding: '2px 0',
                    color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {prop}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Notes callout */}
          <div style={{
            borderRadius: 10, padding: '10px 14px',
            backgroundColor: darkMode ? `${layer.color}15` : `${layer.color}10`,
            borderLeft: `3px solid ${layer.borderColor}`,
          }}>
            <p style={{
              fontSize: 12, margin: 0, lineHeight: 1.5,
              color: darkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)',
            }}>
              <strong style={{ color: layer.borderColor }}>💡 </strong>
              {layer.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stack Visualization ─────────────────────────────────────────
function StackDiagram({ hoveredLayer, darkMode }: { hoveredLayer: string | null; darkMode: boolean }) {
  const layers = [
    { id: 'background', label: 'BG', y: 0, color: '#2d5a1e', opacity: 1 },
    { id: 'section', label: 'Section', y: 1, color: '#3a6b4a', opacity: 0.85 },
    { id: 'glass-card', label: 'Glass', y: 2, color: '#4a7a5a', opacity: 0.7 },
    { id: 'content', label: 'Content', y: 3, color: '#ffffff', opacity: 1 },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', height: 280,
      perspective: '800px', perspectiveOrigin: '50% 40%',
    }}>
      {layers.map((layer, i) => {
        const isHovered = hoveredLayer === layer.id;
        const baseY = 200 - (i * 55);
        const hoverOffset = isHovered ? -12 : 0;
        const otherDimmed = hoveredLayer && hoveredLayer !== layer.id;

        return (
          <div
            key={layer.id}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: baseY + hoverOffset,
              width: 220 - (i * 10),
              height: 44,
              marginLeft: -(220 - (i * 10)) / 2,
              borderRadius: 10,
              backgroundColor: layer.id === 'content'
                ? (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
                : `${layer.color}${isHovered ? 'cc' : '88'}`,
              border: `2px solid ${isHovered ? layer.color : `${layer.color}55`}`,
              boxShadow: isHovered
                ? `0 8px 24px ${layer.color}44, 0 0 0 1px ${layer.color}33`
                : `0 4px 12px rgba(0,0,0,0.2)`,
              transform: `rotateX(35deg) rotateZ(-5deg) translateZ(${i * 4}px)`,
              transformStyle: 'preserve-3d',
              transition: 'all 0.3s ease',
              opacity: otherDimmed ? 0.3 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: i + 1,
            }}
          >
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              color: layer.id === 'content' ? (darkMode ? '#fff' : '#1a2a12') : '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {layer.label}
            </span>
          </div>
        );
      })}

      {/* Z-axis label */}
      <div style={{
        position: 'absolute', right: 20, top: 10, bottom: 40,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>z: 5</span>
        <div style={{ width: 1, flex: 1, margin: '4px 0', backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        <span style={{ fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>z: 0</span>
      </div>

      {/* Arrow */}
      <div style={{
        position: 'absolute', right: 16, top: 10,
        fontSize: 14, color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      }}>↑</div>
    </div>
  );
}

// ─── Key Rules ───────────────────────────────────────────────────
function KeyRules({ darkMode }: { darkMode: boolean }) {
  const rules = [
    {
      icon: '🔒',
      title: 'Never put content inside the glass layer',
      detail: 'CSS filter on a parent creates a stacking context that washes out ALL children. Content must be a sibling, not a child.',
    },
    {
      icon: '🎯',
      title: 'Glass surface is position: absolute',
      detail: 'The glass card fills the wrapper with inset: 0. Content sits beside it with position: relative and a higher z-index.',
    },
    {
      icon: '💎',
      title: 'Content objects are fully opaque',
      detail: 'Logos get dark circle backings (rgba 0.6+). Text uses #ffffff with text-shadow. Score boxes use rgba 0.7+ backgrounds.',
    },
    {
      icon: '🌊',
      title: 'Background contrast drives glass visibility',
      detail: 'The glass is only as visible as the background behind it. More color variation in Layer 0 = more obvious frosted glass in Layer 2.',
    },
    {
      icon: '⚡',
      title: 'Animations live on the glass layer only',
      detail: 'Shimmer, distortion (SVG feTurbulence), specular highlights — all inside Layer 2. Content layer stays perfectly still and crisp.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{
        fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
        margin: '0 0 4px',
      }}>Architecture Rules</h2>
      {rules.map((rule, i) => (
        <div key={i} style={{
          borderRadius: 12, padding: '12px 16px',
          backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{rule.icon}</span>
            <div>
              <p style={{
                fontSize: 13, fontWeight: 700, margin: 0,
                color: darkMode ? '#ffffff' : '#1a2a12',
              }}>{rule.title}</p>
              <p style={{
                fontSize: 12, margin: '4px 0 0', lineHeight: 1.5,
                color: darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
              }}>{rule.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Card Anatomy Diagram ────────────────────────────────────────
function CardAnatomy({ darkMode }: { darkMode: boolean }) {
  return (
    <div style={{
      borderRadius: 16, padding: 20, marginTop: 8,
      backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    }}>
      <h2 style={{
        fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
        margin: '0 0 16px',
      }}>Card Structure (Exploded)</h2>

      {/* Visual code block */}
      <pre style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        lineHeight: 1.8,
        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        backgroundColor: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
        borderRadius: 10,
        padding: 16,
        overflow: 'auto',
        margin: 0,
      }}>
{`┌─ Wrapper ─────────────────────────────┐
│  position: relative                    │
│  border-radius: 16px                   │
│  (clean — NO filters, NO glass)        │
│                                        │
│  ┌─ LAYER 2: Glass Surface ──────────┐ │
│  │  position: absolute; inset: 0     │ │
│  │  class="glass-match-card"         │ │
│  │  backdrop-filter: blur(12px)      │ │
│  │  filter: url(#glass-distort)      │ │
│  │                                   │ │
│  │  ┌ specular highlight ──────────┐ │ │
│  │  │ gradient band at top edge    │ │ │
│  │  └─────────────────────────────-┘ │ │
│  │  ┌ shimmer sweep ──────────────┐  │ │
│  │  │ animated gradient overlay   │  │ │
│  │  └────────────────────────────-┘  │ │
│  │  ┌ edge lines ─────────────────┐  │ │
│  │  │ 1-2px gradient borders     │  │ │
│  │  └────────────────────────────-┘  │ │
│  └───────────────────────────────────┘ │
│                                        │
│  ┌─ LAYER 3: Content Objects ────────┐ │
│  │  position: relative; z-index: 5   │ │
│  │  (SIBLING to glass, not child)    │ │
│  │                                   │ │
│  │  [logo]  Team Name    ● Q3 5:42   │ │
│  │  dark     bold white   solid red  │ │
│  │  circle   text-shadow  box-shadow │ │
│  │                                   │ │
│  │  [logo]  Team A  87-92  Team B [logo] │
│  │  opaque   bold   solid   bold  opaque │
│  │  backing  #fff   dark    #fff  backing│
│  └───────────────────────────────────┘ │
└────────────────────────────────────────┘`}
      </pre>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function LayersPage() {
  const { theme, darkMode } = useTheme();
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(['content', 'glass-card']));
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const toggleLayer = (id: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen" style={{
      backgroundColor: darkMode ? '#0a0f0a' : '#f5f2eb',
      color: darkMode ? '#ffffff' : '#1a2a12',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 800, margin: 0,
            fontFamily: 'Playfair Display, serif',
          }}>UI Layer Architecture</h1>
          <p style={{
            fontSize: 14, margin: '8px 0 0', lineHeight: 1.6,
            color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          }}>
            Ball Knowledge uses a 4-layer system. Glass effects live on their own layer — content sits above, completely independent.
            Tap any layer to expand details.
          </p>
        </div>

        {/* 3D Stack Visualization */}
        <div style={{
          borderRadius: 16, padding: '12px 20px 0', marginBottom: 24,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          overflow: 'hidden',
        }}>
          <h2 style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            margin: '0 0 0',
          }}>Stack View</h2>
          <StackDiagram hoveredLayer={hoveredLayer} darkMode={darkMode} />
        </div>

        {/* Layer Cards — bottom to top (background first) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {[...LAYERS].reverse().map(layer => (
            <LayerCard
              key={layer.id}
              layer={layer}
              isExpanded={expandedLayers.has(layer.id)}
              onToggle={() => toggleLayer(layer.id)}
              isHighlighted={hoveredLayer === layer.id}
              onHover={setHoveredLayer}
              darkMode={darkMode}
            />
          ))}
        </div>

        {/* Card Anatomy */}
        <CardAnatomy darkMode={darkMode} />

        {/* Architecture Rules */}
        <div style={{ marginTop: 20 }}>
          <KeyRules darkMode={darkMode} />
        </div>

        {/* Quick Reference Footer */}
        <div style={{
          marginTop: 28, borderRadius: 16, padding: 20,
          backgroundColor: darkMode ? 'rgba(74, 122, 90, 0.1)' : 'rgba(74, 93, 58, 0.06)',
          border: `1px solid ${darkMode ? 'rgba(74, 122, 90, 0.2)' : 'rgba(74, 93, 58, 0.12)'}`,
        }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
            margin: '0 0 12px',
          }}>Quick Target Guide</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { ask: '"Make glass more visible"', target: 'Layer 0 (Background)', tip: 'Add more color contrast' },
              { ask: '"Glass feels flat"', target: 'Layer 2 (Glass)', tip: 'Add specular / shimmer / distort' },
              { ask: '"Text is hard to read"', target: 'Layer 3 (Content)', tip: 'Increase text-shadow, darker backings' },
              { ask: '"Cards blend together"', target: 'Layer 1 (Section)', tip: 'Increase section bg opacity or borders' },
              { ask: '"Want more depth"', target: 'All layers', tip: 'More spread between layer opacities' },
              { ask: '"Logos look washed out"', target: 'Layer 3 (Content)', tip: 'Darker circle backing, brighter filter' },
            ].map((item, i) => (
              <div key={i} style={{
                borderRadius: 8, padding: '8px 10px',
                backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, margin: 0, color: darkMode ? '#ffffff' : '#1a2a12' }}>
                  {item.ask}
                </p>
                <p style={{
                  fontSize: 10, margin: '2px 0 0',
                  color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  → {item.target}
                </p>
                <p style={{
                  fontSize: 10, margin: '1px 0 0', fontStyle: 'italic',
                  color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                }}>
                  {item.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
