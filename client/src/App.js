import './App.css';

function App() {
  return (
    <div className="app-container">
      <div className="glass-card">
        <h1 className="title">EchoPath</h1>
        <p className="tagline">
          Where learning to speak feels like playing with a friend.
        </p>
        <p className="subtext">
          A joyful communication journey — built for children with autism, guided by their favorite virtual pet.
        </p>
        <button className="cta-button" onClick={() => alert("Coming soon to Vision Pro, iOS, and Web!")}>
          Discover the Path
        </button>
      </div>
    </div>
  );
}

export default App;