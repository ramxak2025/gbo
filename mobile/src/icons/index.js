import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

const Icon = ({ size = 24, color = '#fff', children }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);

// Navigation icons
export const HomeIcon = (props) => (
  <Icon {...props}>
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);

export const UsersIcon = (props) => (
  <Icon {...props}>
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 00-3-3.87" />
    <Path d="M16 3.13a4 4 0 010 7.75" />
  </Icon>
);

export const TrophyIcon = (props) => (
  <Icon {...props}>
    <Path d="M6 9H4.5a2.5 2.5 0 01-2.5-2.5v0A2.5 2.5 0 014.5 4H6" />
    <Path d="M18 9h1.5a2.5 2.5 0 002.5-2.5v0A2.5 2.5 0 0019.5 4H18" />
    <Path d="M4 22h16" />
    <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2" />
    <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 19.24 17 20v2" />
    <Path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </Icon>
);

export const UserIcon = (props) => (
  <Icon {...props}>
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Icon>
);

export const WalletIcon = (props) => (
  <Icon {...props}>
    <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <Line x1="1" y1="10" x2="23" y2="10" />
  </Icon>
);

export const BookIcon = (props) => (
  <Icon {...props}>
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </Icon>
);

export const BuildingIcon = (props) => (
  <Icon {...props}>
    <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <Path d="M9 22V12h6v10" />
    <Line x1="8" y1="6" x2="8" y2="6" />
    <Line x1="12" y1="6" x2="12" y2="6" />
    <Line x1="16" y1="6" x2="16" y2="6" />
    <Line x1="8" y1="10" x2="8" y2="10" />
    <Line x1="16" y1="10" x2="16" y2="10" />
  </Icon>
);

export const PenIcon = (props) => (
  <Icon {...props}>
    <Path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Icon>
);

export const GitBranchIcon = (props) => (
  <Icon {...props}>
    <Line x1="6" y1="3" x2="6" y2="15" />
    <Circle cx="18" cy="6" r="3" />
    <Circle cx="6" cy="18" r="3" />
    <Path d="M18 9a9 9 0 01-9 9" />
  </Icon>
);

export const ListIcon = (props) => (
  <Icon {...props}>
    <Rect x="3" y="3" width="7" height="7" />
    <Rect x="14" y="3" width="7" height="7" />
    <Rect x="14" y="14" width="7" height="7" />
    <Rect x="3" y="14" width="7" height="7" />
  </Icon>
);

// Action icons
export const ChevronLeftIcon = (props) => (
  <Icon {...props}>
    <Polyline points="15 18 9 12 15 6" />
  </Icon>
);

export const ChevronRightIcon = (props) => (
  <Icon {...props}>
    <Polyline points="9 18 15 12 9 6" />
  </Icon>
);

export const PlusIcon = (props) => (
  <Icon {...props}>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

export const XIcon = (props) => (
  <Icon {...props}>
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);

export const SearchIcon = (props) => (
  <Icon {...props}>
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);

export const SunIcon = (props) => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="5" />
    <Line x1="12" y1="1" x2="12" y2="3" />
    <Line x1="12" y1="21" x2="12" y2="23" />
    <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <Line x1="1" y1="12" x2="3" y2="12" />
    <Line x1="21" y1="12" x2="23" y2="12" />
    <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </Icon>
);

export const MoonIcon = (props) => (
  <Icon {...props}>
    <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </Icon>
);

export const TrashIcon = (props) => (
  <Icon {...props}>
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </Icon>
);

export const EditIcon = (props) => (
  <Icon {...props}>
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Icon>
);

export const CheckIcon = (props) => (
  <Icon {...props}>
    <Polyline points="20 6 9 17 4 12" />
  </Icon>
);

export const CameraIcon = (props) => (
  <Icon {...props}>
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Icon>
);

export const CalendarIcon = (props) => (
  <Icon {...props}>
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);

export const RefreshIcon = (props) => (
  <Icon {...props}>
    <Polyline points="23 4 23 10 17 10" />
    <Path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </Icon>
);

export const BellIcon = (props) => (
  <Icon {...props}>
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" />
  </Icon>
);

export const SettingsIcon = (props) => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </Icon>
);

export const LogOutIcon = (props) => (
  <Icon {...props}>
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

export const QRCodeIcon = (props) => (
  <Icon {...props}>
    <Rect x="2" y="2" width="8" height="8" rx="1" />
    <Rect x="14" y="2" width="8" height="8" rx="1" />
    <Rect x="2" y="14" width="8" height="8" rx="1" />
    <Rect x="14" y="14" width="4" height="4" rx="1" />
    <Line x1="22" y1="14" x2="22" y2="14" />
    <Line x1="22" y1="18" x2="22" y2="22" />
    <Line x1="18" y1="22" x2="18" y2="22" />
  </Icon>
);

export const FilterIcon = (props) => (
  <Icon {...props}>
    <Polyline points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Icon>
);

export const DownloadIcon = (props) => (
  <Icon {...props}>
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Icon>
);

export const PhoneIcon = (props) => (
  <Icon {...props}>
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </Icon>
);

export const MapPinIcon = (props) => (
  <Icon {...props}>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Icon>
);

export const ClockIcon = (props) => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Icon>
);

export const ChevronDownIcon = (props) => (
  <Icon {...props}>
    <Polyline points="6 9 12 15 18 9" />
  </Icon>
);

export const MoreVertIcon = (props) => (
  <Icon {...props}>
    <Circle cx="12" cy="5" r="1" fill={props.color || '#fff'} />
    <Circle cx="12" cy="12" r="1" fill={props.color || '#fff'} />
    <Circle cx="12" cy="19" r="1" fill={props.color || '#fff'} />
  </Icon>
);

export const ImageIcon = (props) => (
  <Icon {...props}>
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" />
    <Polyline points="21 15 16 10 5 21" />
  </Icon>
);

export const LinkIcon = (props) => (
  <Icon {...props}>
    <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </Icon>
);
