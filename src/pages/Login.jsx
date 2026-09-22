import{useState}from'react';
import{useNavigate}from'react-router-dom';
import{login}from'../api';

export default function Login()
{
    const[email,setEmail]=useState('admin@hlb.local'),
    [password,setPassword]=useState(''),
    [error,setError]=useState(''),
    nav=useNavigate();
    async function submit(e)
    {
        e.preventDefault();
        try
        {
            const x=await login(email,password);
            localStorage.setItem('token',x.access_token);
            nav('/dashboard')
        }catch(e){
            setError(e.message)
        }
    }return <div className="login">
        <form onSubmit={submit}>
            <div className="brand dark">HLB <span>JIM ROBERTS</span></div>
            <h1>Performance Hub</h1>
            <p>Sign in to manage firm-wide performance.</p>
            {error&&<div className="error">{error}
                </div>
            }
            <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label>
            <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>
            <button>Sign in</button>
        </form>
        </div>
    }