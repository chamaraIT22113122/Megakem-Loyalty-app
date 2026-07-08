import React, { useState, useMemo } from 'react';
import { SVGMap } from 'react-svg-map';
import SriLanka from '@svg-maps/sri-lanka';
import './SriLankaZoneMap.css';

const zoneGroups = {
  1: {
    districts: ['gampaha', 'colombo'],
    color: '#CCCCCC',
    textColor: '#333333',
    name: 'Zone 1 (Western)'
  },
  2: {
    districts: ['kalutara', 'galle', 'matara', 'hambantota'],
    color: '#00AEEF',
    textColor: '#333333',
    name: 'Zone 2 (Southern)'
  },
  3: {
    districts: ['kegalle', 'kandy', 'nuwara-eliya', 'ratnapura', 'badulla', 'monaragala', 'moneragala', 'ampara', 'amparai'],
    color: '#C4D82D',
    textColor: '#333333',
    name: 'Zone 3 (Central / Uva / Sabaragamuwa)'
  },
  4: {
    districts: ['puttalam', 'kurunegala', 'anuradhapura', 'polonnaruwa', 'matale', 'batticaloa'],
    color: '#1E2B58',
    textColor: '#FFFFFF',
    name: 'Zone 4 (North Central / North Western / East)'
  },
  5: {
    districts: ['jaffna', 'kilinochchi', 'mullaitivu', 'mannar', 'vavuniya', 'trincomalee'],
    color: '#00AEEF',
    textColor: '#333333',
    name: 'Zone 5 (Northern)'
  }
};

const districtLabels = [
  { id: 'jaffna', name: 'Jaffna', top: '10%', left: '20%' },
  { id: 'kilinochchi', name: 'Kilinochchi', top: '18%', left: '30%' },
  { id: 'mullaitivu', name: 'Mullaitivu', top: '22%', left: '45%' },
  { id: 'mannar', name: 'Mannar', top: '30%', left: '23%' },
  { id: 'vavuniya', name: 'Vavuniya', top: '32%', left: '38%' },
  { id: 'trincomalee', name: 'Trincomalee', top: '35%', left: '60%' },
  { id: 'anuradhapura', name: 'Anuradhapura', top: '45%', left: '38%' },
  { id: 'polonnaruwa', name: 'Polonnaruwa', top: '50%', left: '57%' },
  { id: 'puttalam', name: 'Puttalam', top: '50%', left: '20%' },
  { id: 'kurunegala', name: 'Kurunegala', top: '60%', left: '32%' },
  { id: 'matale', name: 'Matale', top: '62%', left: '50%' },
  { id: 'batticaloa', name: 'Batticaloa', top: '58%', left: '78%' },
  { id: 'ampara', name: 'Ampara', top: '70%', left: '80%' },
  { id: 'kandy', name: 'Kandy', top: '68%', left: '48%' },
  { id: 'nuwara-eliya', name: 'Nuwara Eliya', top: '75%', left: '50%' },
  { id: 'badulla', name: 'Badulla', top: '75%', left: '63%' },
  { id: 'monaragala', name: 'Moneragala', top: '82%', left: '73%' },
  { id: 'kegalle', name: 'Kegalle', top: '70%', left: '36%' },
  { id: 'ratnapura', name: 'Ratnapura', top: '82%', left: '45%' },
  { id: 'gampaha', name: 'Gampaha', top: '72%', left: '23%' },
  { id: 'colombo', name: 'Colombo', top: '78%', left: '21%' },
  { id: 'kalutara', name: 'Kalutara', top: '85%', left: '23%' },
  { id: 'galle', name: 'Galle', top: '92%', left: '28%' },
  { id: 'matara', name: 'Matara', top: '95%', left: '41%' },
  { id: 'hambantota', name: 'Hambantota', top: '92%', left: '60%' }
];

const getZoneId = (districtId) => {
  if (!districtId) return null;
  const id = districtId.toLowerCase();
  for (const [zone, data] of Object.entries(zoneGroups)) {
    if (data.districts.includes(id)) {
      return parseInt(zone, 10);
    }
  }
  return null;
};

const SriLankaZoneMap = ({ members = [], onZoneSelect, selectedZone: externalSelectedZone }) => {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [selectedZone, setSelectedZone] = useState(4); // Default to a prominent zone
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });

  // Sync external zone to internal highlight
  const activeExternalZone = externalSelectedZone ? parseInt(externalSelectedZone) : null;

  const zoneData = useMemo(() => {
    // Calculate stats based on real members
    const stats = {
      1: { applicators: 0, hardware: 0 },
      2: { applicators: 0, hardware: 0 },
      3: { applicators: 0, hardware: 0 },
      4: { applicators: 0, hardware: 0 },
      5: { applicators: 0, hardware: 0 }
    };

    members.forEach(member => {
      if (!member.location) return;
      const district = member.location.toLowerCase();
      const zoneId = getZoneId(district);
      if (zoneId && stats[zoneId]) {
        // Use exact same logic as backend getStats
        if (member.equipment === 'Hardware') {
          stats[zoneId].hardware++;
        } else {
          stats[zoneId].applicators++;
        }
      }
    });

    return stats;
  }, [members]);

  const handleLocationMouseOver = (event) => {
    const zoneId = getZoneId(event.target.id);
    setHoveredZone(zoneId);
    setTooltip({ visible: true, x: event.clientX, y: event.clientY });
  };

  const handleLocationMouseMove = (event) => {
    setTooltip({ visible: true, x: event.clientX, y: event.clientY });
  };

  const handleLocationMouseOut = () => {
    setHoveredZone(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleLocationClick = (event) => {
    const zoneId = getZoneId(event.target.id);
    if (zoneId) {
      setSelectedZone(zoneId);
      if (onZoneSelect) onZoneSelect(zoneId); // Propagate to parent
    }
  };

  const getLocationClassName = (location, index) => {
    const zoneId = getZoneId(location.id);
    let className = `svg-map__location zone-${zoneId}`;
    const isActive = activeExternalZone ? zoneId === activeExternalZone : zoneId === selectedZone;
    if (isActive) {
      className += ' selected';
    } else if (zoneId === hoveredZone) {
      className += ' hovered';
    }
    return className;
  };

  const activeZone = hoveredZone || (activeExternalZone || selectedZone);
  const activeZoneInfo = zoneGroups[activeZone];
  const currentZoneData = activeZone ? zoneData[activeZone] : { applicators: 0, hardware: 0 };

  return (
    <div className="sri-lanka-map-container">
      <div className="map-svg-wrapper">
        <SVGMap
          map={SriLanka}
          locationClassName={getLocationClassName}
          onLocationMouseOver={handleLocationMouseOver}
          onLocationMouseMove={handleLocationMouseMove}
          onLocationMouseOut={handleLocationMouseOut}
          onLocationClick={handleLocationClick}
        />
        {districtLabels.map((label) => {
          const zoneId = getZoneId(label.id);
          const zoneColorInfo = zoneGroups[zoneId];
          const isSelected = activeZone === zoneId;
          const textColor = zoneColorInfo ? zoneColorInfo.textColor : '#333';
          
          return (
            <div
              key={label.id}
              className={`district-label ${isSelected ? 'highlight' : ''}`}
              style={{
                top: label.top,
                left: label.left,
                color: textColor
              }}
              onClick={() => {
                setSelectedZone(zoneId);
                if (onZoneSelect) onZoneSelect(zoneId);
              }}
              onMouseOver={(e) => {
                setHoveredZone(zoneId);
                setTooltip({ visible: true, x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY })}
              onMouseOut={() => {
                setHoveredZone(null);
                setTooltip(prev => ({ ...prev, visible: false }));
              }}
            >
              {label.name}
            </div>
          );
        })}
      </div>
      
      {tooltip.visible && hoveredZone && activeZoneInfo && (
        <div 
          className="zone-stats-popup"
          style={{
            position: 'fixed',
            left: tooltip.x + 20,
            top: tooltip.y + 20,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <div className="zone-stat-header" style={{ borderBottomColor: activeZoneInfo?.color }}>
            <span style={{ 
              display: 'inline-block', 
              width: 16, 
              height: 16, 
              backgroundColor: activeZoneInfo?.color, 
              borderRadius: '50%', 
              marginRight: 8,
              verticalAlign: 'middle'
            }}></span>
            {activeZoneInfo.name}
          </div>
          <div className="zone-stat-item">
            <span className="zone-stat-label">Applicators:</span>
            <span className="zone-stat-value" style={{ color: activeZoneInfo?.color }}>{currentZoneData.applicators}</span>
          </div>
          <div className="zone-stat-item">
            <span className="zone-stat-label">Hardware Stores:</span>
            <span className="zone-stat-value" style={{ color: activeZoneInfo?.color }}>{currentZoneData.hardware}</span>
          </div>
          <div className="zone-instruction">
            Data is synced in real-time from the Member database.
          </div>
        </div>
      )}
    </div>
  );
};

export default SriLankaZoneMap;
