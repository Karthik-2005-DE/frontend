import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Events from "./pages/Events";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import Home from "./pages/Home";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
         <Route path="/login" element={<Login />} />
        <Route path="/events" element={<Events />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/payment/:id" element={<Payment />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
