import React from 'react';
import { Vendor, GroundingChunk } from '../types';
import { CheckCircleIcon, AlertTriangleIcon, ExternalLinkIcon } from './Icons';

interface VendorTableProps {
  vendors: Vendor[];
  sources: GroundingChunk[];
}

const VendorTable: React.FC<VendorTableProps> = ({ vendors, sources }) => {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700 w-1/5">Vendor</th>
              <th className="px-6 py-4 font-semibold text-slate-700 w-1/5">Price Range</th>
              <th className="px-6 py-4 font-semibold text-slate-700 w-2/5">Matched Features</th>
              <th className="px-6 py-4 font-semibold text-slate-700 w-1/5">Risks / Limits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((vendor, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 align-top">
                  <div className="font-bold text-slate-900 text-lg">{vendor.name}</div>
                  <div className="mt-2 text-xs text-slate-500 italic border-l-2 border-indigo-200 pl-2">
                    "{vendor.verdict}"
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {vendor.priceRange}
                  </span>
                </td>
                <td className="px-6 py-4 align-top">
                  <ul className="space-y-2">
                    {vendor.matchedFeatures.map((feat, i) => (
                      <li key={i} className="flex items-start text-slate-600">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-4 align-top">
                  <ul className="space-y-2">
                    {vendor.risksLimits.map((risk, i) => (
                      <li key={i} className="flex items-start text-slate-600">
                        <AlertTriangleIcon className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sources.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <ExternalLinkIcon className="w-4 h-4 mr-2" />
            Sources & Evidence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((source, idx) => (
              source.web?.uri ? (
                <a 
                  key={idx} 
                  href={source.web.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors text-xs"
                >
                  <span className="font-medium text-indigo-600 truncate">{source.web.title}</span>
                  <span className="text-slate-400 truncate mt-1">{source.web.uri}</span>
                </a>
              ) : null
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorTable;
