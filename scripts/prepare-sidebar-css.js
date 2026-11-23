const fs = require('fs');

const cssToInject = `
<style id="vq-sidebar-system-css">
/* Industry-Grade Collapsible Sidebar Styles */
.side, .side2, .av-side {
  transition: width 0.24s cubic-bezier(0.4, 0, 0.2, 1), padding 0.24s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative !important;
}
.side.collapsed, .side2.collapsed, .av-side.collapsed {
  width: 76px !important;
  min-width: 76px !important;
  padding: 18px 8px !important;
}
.side.collapsed .nh,
.side.collapsed .sub,
.side.collapsed .cnt,
.side.collapsed .navb span,
.side.collapsed .btn span,
.side.collapsed [style*="font-size:19px"],
.side.collapsed [style*="font-size:20px"],
.side.collapsed .avatar + div,
.side2.collapsed .nh,
.side2.collapsed span,
.av-side.collapsed h3,
.av-side.collapsed label,
.av-side.collapsed .sub {
  display: none !important;
}
.side.collapsed .navb, .side2.collapsed .navb {
  justify-content: center !important;
  padding: 10px 0 !important;
}
.side.collapsed .navb svg, .side2.collapsed .navb svg {
  margin: 0 !important;
}
.side.collapsed .row {
  justify-content: center !important;
}

/* Sidebar Top Action Bar (Back + Minimize) */
.vq-sidebar-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0 4px 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(230, 226, 240, 0.6);
}
.side.collapsed .vq-sidebar-topbar {
  flex-direction: column;
  padding: 0 0 10px;
  gap: 8px;
}
.vq-side-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F7F5FF;
  border: 1px solid #ECE7FB;
  color: #4520B8;
  padding: 6px 10px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.vq-side-btn:hover {
  background: #4520B8;
  color: #FFFFFF;
  border-color: #4520B8;
}
.side.collapsed .vq-side-btn.back span {
  display: none !important;
}
.vq-collapse-toggle {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #ECE7FB;
  background: #FFFFFF;
  color: #4520B8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 800;
}
.vq-collapse-toggle:hover {
  background: #4520B8;
  color: #FFFFFF;
  border-color: #4520B8;
}
</style>
`;

console.log('CSS ready, length:', cssToInject.length);
