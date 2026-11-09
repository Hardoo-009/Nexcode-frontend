import logo from '../assets/nexcode-logo-dark.png';

const NexcodeLogo = ({ className = '' }) => {
  return (
    <img src={logo} alt="NEXCODE" className={`object-contain ${className}`} />
  );
};

export default NexcodeLogo;
