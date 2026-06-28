
import { useState } from 'react'; 
import { getAlerts, acknowledgeAlert } from './mockRepository'; 
import type { Alert } from './types'; 

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>(getAlerts());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const handleAcknowledge = (alert: Alert) => {
    acknowledgeAlert(alert.id);
    setAlerts(getAlerts());
  };

  const filteredAlerts = alerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">System Alerts</h1>
        <div>
          <label htmlFor="severity-filter" className="sr-only">Filter by Severity</label>
          <select
            id="severity-filter"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded border border-gray-700"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="warning">Warning</option>
            <option value="medium">Medium</option>
            <option value="info">Info</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-400 italic bg-gray-800 p-6 rounded-lg border border-gray-700">No alerts generated.</p>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <p className="text-gray-400 italic">No alerts match the selected filter.</p>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg border flex justify-between items-center ${
                  alert.severity === 'critical' ? 'bg-red-900/20 border-red-800' :
                  alert.severity === 'high' ? 'bg-orange-900/20 border-orange-800' :
                  alert.severity === 'warning' ? 'bg-yellow-900/20 border-yellow-800' :
                  alert.severity === 'medium' ? 'bg-purple-900/20 border-purple-800' :
                  alert.severity === 'low' ? 'bg-green-900/20 border-green-800' :
                  'bg-blue-900/20 border-blue-800'
                } ${alert.acknowledged ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 mr-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      alert.severity === 'critical' ? 'bg-red-800 text-red-100' :
                      alert.severity === 'high' ? 'bg-orange-800 text-orange-100' :
                      alert.severity === 'warning' ? 'bg-yellow-800 text-yellow-100' :
                      alert.severity === 'medium' ? 'bg-purple-800 text-purple-100' :
                      alert.severity === 'low' ? 'bg-green-800 text-green-100' :
                      'bg-blue-800 text-blue-100'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded uppercase">
                      {alert.alertType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-400">{new Date(alert.createdAt).toLocaleString()}</span>
                    {alert.acknowledged && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">Acknowledged</span>}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-200">{alert.title || alert.message}</h3>
                  <p className="text-sm text-gray-300 mt-1 mb-2">{alert.summary}</p>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="text-gray-400 font-medium">Trend:</span> {alert.trendId}</p>
                    {alert.relatedSignalIds?.length > 0 && <p><span className="text-gray-400 font-medium">Signals:</span> {alert.relatedSignalIds.join(', ')}</p>}
                    {alert.relatedDocumentIds?.length > 0 && <p><span className="text-gray-400 font-medium">Documents:</span> {alert.relatedDocumentIds.join(', ')}</p>}
                    {alert.relatedSourceIds?.length > 0 && <p><span className="text-gray-400 font-medium">Sources:</span> {alert.relatedSourceIds.join(', ')}</p>}
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button 
                    onClick={() => handleAcknowledge(alert)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded text-sm font-medium transition-colors whitespace-nowrap self-start mt-2"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
