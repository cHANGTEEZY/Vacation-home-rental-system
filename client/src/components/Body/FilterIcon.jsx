import "./FilterIcon.css";

const FilterIcon = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <div
      className={`filter-icon ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="icon-wrapper">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <span className="icon-label">{label}</span>
    </div>
  );
};

export default FilterIcon;
