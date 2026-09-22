import{Routes,Route,Navigate}from'react-router-dom';
import Layout from'./components/Layout';
import Login from'./pages/Login';
import Dashboard from'./pages/Dashboard';
import Entries from'./pages/Entries';
import Employees from'./pages/Employees';
import Admin from'./pages/Admin';

const Guard=({children})=>localStorage.getItem('token')?children:<Navigate to="/login" replace/>;
export default function App()
{
    return <Routes><Route path="/login" element={<Login/>}/>
           <Route path="/" element={<Guard><Layout/></Guard>}>
           <Route index element={<Navigate to="/dashboard"/>}/>
           <Route path="dashboard" element={<Dashboard/>}/>
           <Route path="entries" element={<Entries/>}/>
           <Route path="employees" element={<Employees/>}/>
           <Route path="admin" element={<Admin/>}/></Route>
           </Routes>
}