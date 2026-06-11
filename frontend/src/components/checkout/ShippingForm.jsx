export const ShippingForm = ({ shipping, onChange }) => (
  <div className="panel">
    <h3 className="panel__title"><i className="fa-solid fa-location-dot"></i> Shipping Details</h3>
    <div className="form-row">
      <div className="form-group">
        <label>Full Name</label>
        <input required value={shipping.name} onChange={(e) => onChange("name", e.target.value)} placeholder="John Doe" data-testid="shipping-name-input" />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input required value={shipping.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+1 555 000 1234" data-testid="shipping-phone-input" />
      </div>
    </div>
    <div className="form-group">
      <label>Street Address</label>
      <input required value={shipping.address} onChange={(e) => onChange("address", e.target.value)} placeholder="100 Main Street, Apt 4B" data-testid="shipping-address-input" />
    </div>
    <div className="form-row">
      <div className="form-group">
        <label>City</label>
        <input required value={shipping.city} onChange={(e) => onChange("city", e.target.value)} placeholder="Boston" data-testid="shipping-city-input" />
      </div>
      <div className="form-group">
        <label>ZIP Code</label>
        <input value={shipping.zip_code} onChange={(e) => onChange("zip_code", e.target.value)} placeholder="02108" data-testid="shipping-zip-input" />
      </div>
    </div>
  </div>
);
