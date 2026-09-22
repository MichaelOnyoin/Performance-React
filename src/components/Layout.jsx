import{NavLink,Outlet,useNavigate}from'react-router-dom';

export default function Layout()
{
    const nav=useNavigate();
    return <>
    <header><div className="brand">HLB <span>JIM ROBERTS</span></div>
    <button className="ghost" onClick={()=>{localStorage.clear();nav('/login')}}>Sign out</button>
    </header>
    <div className="shell"><aside>
        <NavLink to="/dashboard">Partner Dashboard</NavLink>
        <NavLink to="/entries">KPI Entries</NavLink>
        <NavLink to="/employees">Employees</NavLink>
        <NavLink to="/admin">Administration</NavLink>
        </aside>
        <main>
            <Outlet/></main>
    </div>
    </>
}